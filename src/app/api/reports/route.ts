import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily"; // daily, monthly, yearly
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const startDate = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateTo ? new Date(dateTo + "T23:59:59") : new Date();

    const dateFilter = and(gte(invoices.date, startDate), lte(invoices.date, endDate));

    let groupBy: any;
    let dateFormat: string;

    if (type === "daily") {
      dateFormat = "YYYY-MM-DD";
      groupBy = sql`DATE(${invoices.date})`;
    } else if (type === "monthly") {
      dateFormat = "YYYY-MM";
      groupBy = sql`TO_CHAR(${invoices.date}, 'YYYY-MM')`;
    } else {
      dateFormat = "YYYY";
      groupBy = sql`EXTRACT(YEAR FROM ${invoices.date})`;
    }

    const report = await db
      .select({
        period: groupBy,
        invoiceCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)`,
        totalCollected: sql<string>`COALESCE(SUM(CAST(${invoices.paid} AS DECIMAL)), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CAST(${invoices.balance} AS DECIMAL)), 0)`,
        totalTax: sql<string>`COALESCE(SUM(CAST(${invoices.taxAmount} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(dateFilter)
      .groupBy(groupBy)
      .orderBy(groupBy);

    // Totals
    const [totals] = await db
      .select({
        invoiceCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)`,
        totalCollected: sql<string>`COALESCE(SUM(CAST(${invoices.paid} AS DECIMAL)), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CAST(${invoices.balance} AS DECIMAL)), 0)`,
        totalTax: sql<string>`COALESCE(SUM(CAST(${invoices.taxAmount} AS DECIMAL)), 0)`,
      })
      .from(invoices)
      .where(dateFilter);

    return NextResponse.json({
      type,
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      data: report.map((r) => ({
        period: String(r.period),
        invoiceCount: r.invoiceCount,
        totalRevenue: parseFloat(r.totalRevenue),
        totalCollected: parseFloat(r.totalCollected),
        totalPending: parseFloat(r.totalPending),
        totalTax: parseFloat(r.totalTax),
      })),
      totals: {
        invoiceCount: totals?.invoiceCount || 0,
        totalRevenue: parseFloat(totals?.totalRevenue || "0"),
        totalCollected: parseFloat(totals?.totalCollected || "0"),
        totalPending: parseFloat(totals?.totalPending || "0"),
        totalTax: parseFloat(totals?.totalTax || "0"),
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
