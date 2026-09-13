import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get the last invoice number for today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const lastInvoice = await db
      .select({ invoiceNo: invoices.invoiceNo })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    let seq = 1;
    if (lastInvoice[0]) {
      // Try to extract sequence from last invoice
      const lastNo = lastInvoice[0].invoiceNo;
      if (lastNo.startsWith(`EC${String(year).slice(-2)}${month}${day}`)) {
        seq = parseInt(lastNo.slice(-3)) + 1;
      }
    }

    const nextInvoiceNo = `EC${String(year).slice(-2)}${month}${day}${String(seq).padStart(3, "0")}`;

    return NextResponse.json({ 
      nextInvoiceNo,
      date: now.toISOString(),
      formattedDate: now.toLocaleString("en-IN"),
    });
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    return NextResponse.json({ error: "Failed to get next number" }, { status: 500 });
  }
}
