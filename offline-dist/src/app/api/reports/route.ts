import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (isOffline || !db) {
      const from = dateFrom || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = dateTo || new Date().toISOString().slice(0, 10);
      const report = serverOfflineStore.getReports(type, from, to);
      return NextResponse.json({
        type,
        dateFrom: from,
        dateTo: to,
        ...report,
      });
    }

    const startDate = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateTo ? new Date(dateTo + "T23:59:59") : new Date();

    const dateFilter = and(gte(invoices.date, startDate), lte(invoices.date, endDate));

    let groupBy: any;

    if (type === "daily") {
      groupBy = sql`DATE(${invoices.date})`;
    } else if (type === "monthly") {
      groupBy = sql`TO_CHAR(${invoices.date}, 'YYYY-MM')`;
    } else {
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
      data: report.map((r: any) => ({
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
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type") || "daily";
      const dateFrom = searchParams.get("dateFrom") || new Date().toISOString().slice(0, 10);
      const dateTo = searchParams.get("dateTo") || new Date().toISOString().slice(0, 10);
      const report = serverOfflineStore.getReports(type, dateFrom, dateTo);
      return NextResponse.json({ type, dateFrom, dateTo, ...report });
    } catch {
      return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
  }
}
