import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices, invoiceItems, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  mobile: z.string().min(10).optional(),
  jobNo: z.string().optional(),
  deviceModel: z.string().optional().nullable(),
  serialNo: z.string().optional().nullable(),
  imei: z.string().optional().nullable(),
  problem: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  jobStatus: z.enum(["received", "in_progress", "completed", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).optional(),
  serviceCharge: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  paid: z.number().min(0).optional(),
  warrantyDays: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);

    if (isOffline || !db) {
      const invoice = serverOfflineStore.getInvoiceById(numId);
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ ...invoice, items: (invoice as any).items || [], payments: [] });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, numId));

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    const paymentRecords = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id));

    return NextResponse.json({ ...invoice, items, payments: paymentRecords });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    try {
      const { id } = await params;
      const invoice = serverOfflineStore.getInvoiceById(parseInt(id));
      if (invoice) {
        return NextResponse.json({ ...invoice, items: (invoice as any).items || [], payments: [] });
      }
    } catch {}
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    const body = await request.json();
    const validated = updateSchema.parse(body);

    if (isOffline || !db) {
      const updated = serverOfflineStore.updateInvoice(numId, validated);
      if (!updated) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ ...updated, items: (updated as any).items || [] });
    }

    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, numId));

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = validated.items || [];
    const serviceCharge = validated.serviceCharge ?? parseFloat(existing.serviceCharge);
    const taxRate = validated.taxRate ?? parseFloat(existing.taxRate);
    const discount = validated.discount ?? parseFloat(existing.discount);
    const paid = validated.paid ?? parseFloat(existing.paid);

    const subtotal = items.length > 0
      ? items.reduce((sum, item) => sum + item.amount, 0)
      : parseFloat(existing.subtotal);
    
    const taxableAmount = subtotal + serviceCharge - discount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;
    const balance = Math.max(0, total - paid);

    let paymentStatus = validated.paymentStatus || existing.paymentStatus;
    if (paid >= total) paymentStatus = "paid";
    else if (paid > 0) paymentStatus = "partial";
    else paymentStatus = "pending";

    const [updated] = await db
      .update(invoices)
      .set({
        customerName: validated.customerName ?? existing.customerName,
        mobile: validated.mobile ?? existing.mobile,
        jobNo: validated.jobNo ?? existing.jobNo,
        deviceModel: validated.deviceModel ?? existing.deviceModel,
        serialNo: validated.serialNo ?? existing.serialNo,
        imei: validated.imei ?? existing.imei,
        problem: validated.problem ?? existing.problem,
        technicianName: validated.technicianName ?? existing.technicianName,
        jobStatus: validated.jobStatus ?? existing.jobStatus,
        paymentStatus,
        subtotal: subtotal.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        paid: paid.toFixed(2),
        balance: balance.toFixed(2),
        warrantyDays: validated.warrantyDays ?? existing.warrantyDays,
        notes: validated.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, numId))
      .returning();

    if (validated.items) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, numId));
      if (validated.items.length > 0) {
        await db.insert(invoiceItems).values(
          validated.items.map((item) => ({
            invoiceId: numId,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate.toFixed(2),
            amount: item.amount.toFixed(2),
          }))
        );
      }
    }

    const updatedItems = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, numId));

    return NextResponse.json({ ...updated, items: updatedItems });
  } catch (error) {
    console.error("Error updating invoice:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);

    if (isOffline || !db) {
      const success = serverOfflineStore.deleteInvoice(numId);
      if (!success) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    await db.delete(invoices).where(eq(invoices.id, numId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
