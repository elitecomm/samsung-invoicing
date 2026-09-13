import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices, invoiceItems, payments } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  mobile: z.string().min(10, "Valid mobile number required"),
  jobNo: z.string().min(1, "Job number is required"),
  deviceModel: z.string().optional().nullable(),
  serialNo: z.string().optional().nullable(),
  imei: z.string().optional().nullable(),
  problem: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  jobStatus: z.enum(["received", "in_progress", "completed", "delivered", "cancelled"]).default("received"),
  paymentStatus: z.enum(["pending", "partial", "paid"]).default("pending"),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).min(1, "At least one item is required"),
  serviceCharge: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(18),
  discount: z.number().min(0).default(0),
  paid: z.number().min(0).default(0),
  warrantyDays: z.number().min(0).default(30),
  notes: z.string().optional().nullable(),
});

// GET - List invoices with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const jobStatus = searchParams.get("jobStatus");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Offline mode
    if (isOffline || !db) {
      let allInvoices = serverOfflineStore.getInvoices();

      if (search) {
        const lower = search.toLowerCase();
        allInvoices = allInvoices.filter(
          (inv) =>
            inv.customerName.toLowerCase().includes(lower) ||
            inv.mobile.includes(search) ||
            inv.invoiceNo.toLowerCase().includes(lower) ||
            inv.jobNo.toLowerCase().includes(lower)
        );
      }
      if (jobStatus) {
        allInvoices = allInvoices.filter((inv) => inv.jobStatus === jobStatus);
      }
      if (paymentStatus) {
        allInvoices = allInvoices.filter((inv) => inv.paymentStatus === paymentStatus);
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        allInvoices = allInvoices.filter((inv) => new Date(inv.date) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo + "T23:59:59");
        allInvoices = allInvoices.filter((inv) => new Date(inv.date) <= to);
      }

      allInvoices = allInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const paginated = allInvoices.slice(offset, offset + limit);

      const invoicesWithItems = paginated.map((inv: any) => ({
        ...inv,
        items: inv.items || [],
      }));

      return NextResponse.json({
        invoices: invoicesWithItems,
        total: allInvoices.length,
      });
    }

    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${invoices.customerName} ILIKE ${`%${search}%`} OR ${invoices.mobile} ILIKE ${`%${search}%`} OR ${invoices.invoiceNo} ILIKE ${`%${search}%`} OR ${invoices.jobNo} ILIKE ${`%${search}%`})`
      );
    }
    if (jobStatus) conditions.push(eq(invoices.jobStatus, jobStatus as any));
    if (paymentStatus) conditions.push(eq(invoices.paymentStatus, paymentStatus as any));
    if (dateFrom) conditions.push(gte(invoices.date, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(invoices.date, new Date(dateTo + "T23:59:59")));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allInvoices = await db
      .select()
      .from(invoices)
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const invoicesWithItems = await Promise.all(
      allInvoices.map(async (inv: any) => {
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, inv.id));
        return { ...inv, items };
      })
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(whereClause);

    return NextResponse.json({
      invoices: invoicesWithItems,
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    // Fallback to offline
    try {
      const allInvoices = serverOfflineStore.getInvoices();
      return NextResponse.json({ invoices: allInvoices.map((inv: any) => ({ ...inv, items: inv.items || [] })), total: allInvoices.length });
    } catch {
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
  }
}

// POST - Create new invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = invoiceSchema.parse(body);

    // Offline mode
    if (isOffline || !db) {
      const newInvoice = serverOfflineStore.createInvoice(validated);
      return NextResponse.json({ ...newInvoice, items: newInvoice.items }, { status: 201 });
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayInvoices = await db
      .select({ invoiceNo: invoices.invoiceNo })
      .from(invoices)
      .where(gte(invoices.createdAt, todayStart))
      .orderBy(desc(invoices.createdAt));
    
    const seq = String(todayInvoices.length + 1).padStart(3, "0");
    const invoiceNo = `EC${String(year).slice(-2)}${month}${day}${seq}`;

    const subtotal = validated.items.reduce((sum, item) => sum + item.amount, 0);
    const taxableAmount = subtotal + validated.serviceCharge - validated.discount;
    const taxAmount = (taxableAmount * validated.taxRate) / 100;
    const total = taxableAmount + taxAmount;
    const balance = Math.max(0, total - validated.paid);

    let paymentStatus = validated.paymentStatus;
    if (validated.paid >= total) paymentStatus = "paid";
    else if (validated.paid > 0) paymentStatus = "partial";
    else paymentStatus = "pending";

    const warrantyExpiry = validated.warrantyDays
      ? new Date(now.getTime() + validated.warrantyDays * 24 * 60 * 60 * 1000)
      : null;

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        invoiceNo,
        date: now,
        customerName: validated.customerName,
        mobile: validated.mobile,
        jobNo: validated.jobNo,
        deviceModel: validated.deviceModel,
        serialNo: validated.serialNo,
        imei: validated.imei,
        problem: validated.problem,
        technicianName: validated.technicianName,
        jobStatus: validated.jobStatus,
        paymentStatus,
        subtotal: subtotal.toFixed(2),
        serviceCharge: validated.serviceCharge.toFixed(2),
        taxRate: validated.taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discount: validated.discount.toFixed(2),
        total: total.toFixed(2),
        paid: validated.paid.toFixed(2),
        balance: balance.toFixed(2),
        warrantyDays: validated.warrantyDays,
        warrantyExpiry,
        notes: validated.notes,
      })
      .returning();

    if (validated.items.length > 0) {
      await db.insert(invoiceItems).values(
        validated.items.map((item) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate.toFixed(2),
          amount: item.amount.toFixed(2),
        }))
      );
    }

    if (validated.paid > 0) {
      await db.insert(payments).values({
        invoiceId: newInvoice.id,
        amount: validated.paid.toFixed(2),
        method: "cash",
        notes: "Initial payment",
      });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, newInvoice.id));

    return NextResponse.json({ ...newInvoice, items }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
