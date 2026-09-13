"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Download, Eye, Edit, Trash2, FileText, MessageCircle, Plus, Shield } from "lucide-react";
import { formatINR, formatDate, getStatusStyle } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function InvoicesList() {
  const { isAdmin, permissions } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [search, jobStatus, paymentStatus, dateFrom, dateTo]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (jobStatus) params.set("jobStatus", jobStatus);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions?.canDeleteInvoices) {
      alert("Only admin can delete invoices");
      return;
    }
    if (!confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;
    
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      fetchInvoices();
    } catch (error) {
      alert("Failed to delete invoice");
    }
  };

  const exportToCSV = () => {
    if (!permissions?.canExportData) {
      alert("Only admin can export data");
      return;
    }
    if (invoices.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Invoice No", "Date", "Customer Name", "Mobile", "Job No", "Device", "Problem", "Subtotal", "Service", "Tax", "Discount", "Total", "Paid", "Balance", "Job Status", "Payment Status"];
    const rows = invoices.map((inv) => [
      inv.invoiceNo,
      formatDate(inv.date),
      inv.customerName,
      inv.mobile,
      inv.jobNo,
      inv.deviceModel || "",
      inv.problem || "",
      inv.subtotal,
      inv.serviceCharge,
      inv.taxAmount,
      inv.discount,
      inv.total,
      inv.paid,
      inv.balance,
      inv.jobStatus,
      inv.paymentStatus,
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            All Invoices
            {!isAdmin && <span className="text-sm font-normal bg-green-100 text-green-700 px-2.5 py-1 rounded-full">User Mode • View Only</span>}
          </h1>
          <p className="text-gray-600 mt-1">
            {total} invoice{total !== 1 ? "s" : ""} found {isAdmin ? "• Full Access" : "• Create & View Only"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, invoice or job no..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={jobStatus}
            onChange={(e) => setJobStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Job Status</option>
            <option value="received">Received</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No invoices found</p>
            <Link
              href="/invoices/new"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Device</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const jobStyle = getStatusStyle("job", inv.jobStatus);
                  const payStyle = getStatusStyle("payment", inv.paymentStatus);
                  return (
                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {inv.invoiceNo}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(inv.date)}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{inv.customerName}</div>
                        <div className="text-xs text-gray-500">{inv.mobile}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{inv.jobNo}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{inv.deviceModel || "-"}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {formatINR(inv.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${jobStyle.color}`}>
                          {jobStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${payStyle.color}`}>
                          {payStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          {isAdmin ? (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete (Admin only)"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="p-2 text-gray-300 cursor-not-allowed" title="Delete - Admin only">
                              <Shield size={16} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
