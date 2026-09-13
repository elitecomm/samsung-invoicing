"use client";

import { useEffect, useState } from "react";
import { FileText, TrendingUp, DollarSign, AlertCircle, Clock } from "lucide-react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

interface DashboardStats {
  period: string;
  totalInvoices: number;
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  jobStatusStats: { status: string; count: number }[];
  paymentStatusStats: { status: string; count: number }[];
  recentInvoices: any[];
  dailyRevenue: { date: string; total: number; count: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      label: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Collected",
      value: formatINR(stats.totalCollected),
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      label: "Pending",
      value: formatINR(stats.totalPending),
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your service center</p>
        </div>
        <div className="flex gap-2">
          {["today", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Job Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Job Status</h2>
          <div className="space-y-3">
            {stats.jobStatusStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700">
                  {stat.status.replace("_", " ")}
                </span>
                <span className="font-semibold text-gray-900">{stat.count}</span>
              </div>
            ))}
            {stats.jobStatusStats.length === 0 && (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Status</h2>
          <div className="space-y-3">
            {stats.paymentStatusStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700">{stat.status}</span>
                <span className="font-semibold text-gray-900">{stat.count}</span>
              </div>
            ))}
            {stats.paymentStatusStats.length === 0 && (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Invoices</h2>
          <Link
            href="/invoices"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Invoice No
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Job No
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{inv.customerName}</td>
                  <td className="py-3 px-4 text-gray-700">{inv.jobNo}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {formatINR(inv.total)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        inv.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : inv.paymentStatus === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    <Clock className="inline-block mb-2" size={32} />
                    <p>No invoices yet. Create your first invoice!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
