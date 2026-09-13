import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { invoices } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    // Offline mode - use in-memory store
    if (isOffline || !db) {
      const stats = serverOfflineStore.getDashboardStats(period);
      return NextResponse.json(stats);
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(2000, 0, 1);
    }

    const dateFilter = and(gte(invoices.date, startDate), lte(invoices.date, endDate));

    const [totalInvoicesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(dateFilter);

    const [revenueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)` })
      .from(invoices)
      .where(dateFilter);

    const [collectedResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${invoices.paid} AS DECIMAL)), 0)` })
      .from(invoices)
      .where(dateFilter);

    const [pendingResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${invoices.balance} AS DECIMAL)), 0)` })
      .from(invoices)
      .where(dateFilter);

    const jobStatusStats = await db
      .select({
        status: invoices.jobStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(dateFilter)
      .groupBy(invoices.jobStatus);

    const paymentStatusStats = await db
      .select({
        status: invoices.paymentStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(dateFilter)
      .groupBy(invoices.paymentStatus);

    const recentInvoices = await db
      .select()
      .from(invoices)
      .where(dateFilter)
      .orderBy(sql`${invoices.createdAt} DESC`)
      .limit(5);

    const chartDays = period === "year" ? 30 : period === "month" ? 30 : 7;
    const chartStart = new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000);
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${invoices.date})::text`,
        total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(gte(invoices.date, chartStart))
      .groupBy(sql`DATE(${invoices.date})`)
      .orderBy(sql`DATE(${invoices.date})`);

    return NextResponse.json({
      period,
      totalInvoices: totalInvoicesResult?.count || 0,
      totalRevenue: parseFloat(revenueResult?.total || "0"),
      totalCollected: parseFloat(collectedResult?.total || "0"),
      totalPending: parseFloat(pendingResult?.total || "0"),
      jobStatusStats,
      paymentStatusStats,
      recentInvoices,
      dailyRevenue,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Fallback to offline store
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") || "today";
      const stats = serverOfflineStore.getDashboardStats(period);
      return NextResponse.json(stats);
    } catch {
      return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
    }
  }
}
