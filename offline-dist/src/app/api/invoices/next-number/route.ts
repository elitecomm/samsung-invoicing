import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices } from "@/db/schema";
import { desc } from "drizzle-orm";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

export async function GET() {
  try {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    if (isOffline || !db) {
      const allInvoices = serverOfflineStore.getInvoices();
      const todayPrefix = `EC${String(year).slice(-2)}${month}${day}`;
      const todayCount = allInvoices.filter((inv) => inv.invoiceNo.startsWith(todayPrefix)).length;
      const nextInvoiceNo = `${todayPrefix}${String(todayCount + 1).padStart(3, "0")}`;
      return NextResponse.json({ 
        nextInvoiceNo,
        date: now.toISOString(),
        formattedDate: now.toLocaleString("en-IN"),
      });
    }
    
    const lastInvoice = await db
      .select({ invoiceNo: invoices.invoiceNo })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    let seq = 1;
    if (lastInvoice[0]) {
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
