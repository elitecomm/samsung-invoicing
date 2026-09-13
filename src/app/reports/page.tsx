"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, TrendingUp, IndianRupee, Receipt, PiggyBank } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("daily");
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType, dateFrom, dateTo]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`/api/reports?${params}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;
    const headers = ["Period", "Invoice Count", "Revenue", "Collected", "Pending", "Tax"];
    const rows = data.data.map((r: any) => [
      r.period,
      r.invoiceCount,
      r.totalRevenue.toFixed(2),
      r.totalCollected.toFixed(2),
      r.totalPending.toFixed(2),
      r.totalTax.toFixed(2),
    ]);
    
    // Add totals row
    rows.push([
      "TOTAL",
      data.totals.invoiceCount,
      data.totals.totalRevenue.toFixed(2),
      data.totals.totalCollected.toFixed(2),
      data.totals.totalPending.toFixed(2),
      data.totals.totalTax.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${reportType}_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find max value for chart scaling
  const maxRevenue = data?.data?.reduce((max: number, r: any) => Math.max(max, r.totalRevenue), 0) || 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 />
            Reports
          </h1>
          <p className="text-gray-600 mt-1">Revenue and business analytics</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
          </select>
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                const today = new Date();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateFrom(monthStart.toISOString().slice(0, 10));
                setDateTo(today.toISOString().slice(0, 10));
              }}
              className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          Loading report...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold">{data.totals.invoiceCount}</p>
                </div>
                <Receipt className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatINR(data.totals.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatINR(data.totals.totalCollected)}
                  </p>
                </div>
                <PiggyBank className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">GST Collected</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatINR(data.totals.totalTax)}
                  </p>
                </div>
                <IndianRupee className="text-purple-600" size={32} />
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Revenue Chart</h2>
            {data.data.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available for selected period</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.data.map((row: any, idx: number) => {
                  const widthPercent = maxRevenue > 0 ? (row.totalRevenue / maxRevenue) * 100 : 0;
                  const collectedPercent = maxRevenue > 0 ? (row.totalCollected / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-gray-600 font-mono flex-shrink-0">
                        {row.period}
                      </div>
                      <div className="flex-1 relative">
                        <div className="h-8 bg-gray-100 rounded relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500 opacity-40"
                            style={{ width: `${widthPercent}%` }}
                          />
                          <div
                            className="absolute inset-y-0 left-0 bg-green-500"
                            style={{ width: `${collectedPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right text-sm font-semibold flex-shrink-0">
                        {formatINR(row.totalRevenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 opacity-40 rounded"></div>
                <span>Total Revenue</span>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Period</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Invoices</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Collected</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Pending</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">GST</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{row.period}</td>
                      <td className="py-3 px-4 text-right">{row.invoiceCount}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatINR(row.totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-green-600">{formatINR(row.totalCollected)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatINR(row.totalPending)}</td>
                      <td className="py-3 px-4 text-right text-purple-600">{formatINR(row.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 font-bold">
                  <tr>
                    <td className="py-3 px-4">TOTAL</td>
                    <td className="py-3 px-4 text-right">{data.totals.invoiceCount}</td>
                    <td className="py-3 px-4 text-right">{formatINR(data.totals.totalRevenue)}</td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatINR(data.totals.totalCollected)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatINR(data.totals.totalPending)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600">
                      {formatINR(data.totals.totalTax)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
