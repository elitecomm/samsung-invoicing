import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)));

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    const pdfBuffer = await generateInvoicePDF({ ...invoice, items });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNo}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error?.message || String(error) }, { status: 500 });
  }
}
