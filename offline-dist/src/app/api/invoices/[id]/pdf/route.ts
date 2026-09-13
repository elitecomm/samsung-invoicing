import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePDF } from "@/lib/pdf";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);

    let invoiceData: any;

    if (isOffline || !db) {
      const inv = serverOfflineStore.getInvoiceById(numId);
      if (!inv) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      invoiceData = { ...inv, items: (inv as any).items || [] };
    } else {
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

      invoiceData = { ...invoice, items };
    }

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoiceData.invoiceNo}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
