"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, FileDown, MessageCircle, Download, Printer, 
  Edit, Save, User, Phone, Briefcase, Wrench, Calendar,
  CreditCard, CheckCircle, Clock, AlertCircle, Send, Shield
} from "lucide-react";
import { formatINR, formatDate, formatShortDate, getStatusStyle } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAdmin, permissions } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    fetchInvoice();
    fetchSettings();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setInvoice(data);
      setEditData({
        ...data,
        items: data.items.map((it: any) => ({
          description: it.description,
          quantity: it.quantity,
          rate: parseFloat(it.rate),
          amount: parseFloat(it.amount),
        })),
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings || {});
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (!invoice || !settings.whatsapp_message_template) return;
    
    let msg = settings.whatsapp_message_template;
    const replacements: Record<string, string> = {
      customer_name: invoice.customerName,
      company_name: settings.company_name || "Elite Communication",
      invoice_no: invoice.invoiceNo,
      job_no: invoice.jobNo,
      total: Number(invoice.total).toFixed(2),
      paid: Number(invoice.paid).toFixed(0),
      balance: Number(invoice.balance).toFixed(2),
      warranty_days: String(invoice.warrantyDays || 0),
      warranty_expiry: invoice.warrantyExpiry 
        ? formatShortDate(invoice.warrantyExpiry) 
        : "N/A",
      contact: settings.contact || "9569894030",
      mobile: invoice.mobile,
      device: invoice.deviceModel || "N/A",
      serial: invoice.serialNo || "N/A",
      problem: invoice.problem || "N/A",
      date: formatDate(invoice.date),
    };

    Object.entries(replacements).forEach(([key, value]) => {
      msg = msg.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    });

    setWhatsappMessage(msg);
  }, [invoice, settings]);

  useEffect(() => {
    if (!invoice) return;
    fetch(`/api/invoices/${id}/pdf`)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      })
      .catch(console.error);
    
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [invoice, id]);

  const downloadPDF = () => {
    if (!pdfUrl || !invoice) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Invoice_${invoice.invoiceNo}.pdf`;
    a.click();
  };

  const openPDF = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  const sendViaWhatsapp = () => {
    if (!invoice) return;
    
    let phone = invoice.mobile.replace(/\D/g, "");
    if (phone.length === 10) phone = "91" + phone;
    if (!phone.startsWith("91") && phone.length === 12) phone = phone;
    
    const encodedMsg = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMsg}`;
    
    downloadPDF();
    
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
      alert(
        "PDF downloaded! WhatsApp will open now.\n\n" +
        "Please attach the downloaded PDF file to the WhatsApp chat manually.\n\n" +
        "Tip: The PDF has been downloaded to your device's Downloads folder."
      );
    }, 500);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
    }
  };

  const handleSave = async () => {
    if (!permissions?.canEditInvoices) {
      alert("Only admin can edit invoices");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      await fetchInvoice();
      setEditMode(false);
      alert("Invoice updated successfully!");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!permissions?.canDeleteInvoices) {
      alert("Only admin can delete invoices");
      return;
    }
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      router.push("/invoices");
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const recordPayment = async () => {
    if (!isAdmin) {
      alert("Only admin can record payments");
      return;
    }
    const amount = prompt(`Enter payment amount (Balance: ₹${Number(invoice.balance).toFixed(2)}):`);
    if (!amount) return;
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Invalid amount");
      return;
    }

    const newPaid = parseFloat(invoice.paid) + paymentAmount;
    
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: newPaid }),
      });
      await fetchInvoice();
      alert("Payment recorded successfully!");
    } catch (error) {
      alert("Failed to record payment");
    }
  };

  if (loading) {
    return <div className="p-8">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Invoice not found</p>
        <Link href="/invoices" className="text-blue-600 hover:underline">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  const jobStyle = getStatusStyle("job", invoice.jobStatus);
  const payStyle = getStatusStyle("payment", invoice.paymentStatus);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Invoice {invoice.invoiceNo}
              {!isAdmin && <span className="text-sm font-normal bg-green-100 text-green-700 px-2.5 py-1 rounded-full">View Only</span>}
            </h1>
            <p className="text-gray-600 mt-1">
              {formatDate(invoice.date)} • {isAdmin ? "Admin • Full Access" : "User • View Mode"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <FileDown size={16} />
            View PDF
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={sendViaWhatsapp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <MessageCircle size={16} />
            Send via WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Printer size={16} />
            Print
          </button>
          {isAdmin ? (
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <Edit size={16} />
              {editMode ? "Cancel" : "Edit"}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border" title="Edit - Admin only">
              <Shield size={16} />
              Edit (Admin)
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${jobStyle.color}`}>
          Job: {jobStyle.label}
        </span>
        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${payStyle.color}`}>
          Payment: {payStyle.label}
        </span>
        {!isAdmin && (
          <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
            User Mode: View Only
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <User size={20} />
              Customer Information
            </h2>
            {editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={editData.customerName}
                  onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Customer Name"
                />
                <input
                  type="text"
                  value={editData.mobile}
                  onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Mobile"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-lg font-semibold">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Phone size={16} />
                    <a href={`tel:${invoice.mobile}`} className="text-blue-600 hover:underline">
                      {invoice.mobile}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <Briefcase size={20} />
              Job Details
            </h2>
            {editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job No</label>
                  <input
                    type="text"
                    value={editData.jobNo}
                    onChange={(e) => setEditData({ ...editData, jobNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Device Model</label>
                  <input
                    type="text"
                    value={editData.deviceModel || ""}
                    onChange={(e) => setEditData({ ...editData, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Serial No</label>
                  <input
                    type="text"
                    value={editData.serialNo || ""}
                    onChange={(e) => setEditData({ ...editData, serialNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IMEI</label>
                  <input
                    type="text"
                    value={editData.imei || ""}
                    onChange={(e) => setEditData({ ...editData, imei: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Problem</label>
                  <textarea
                    value={editData.problem || ""}
                    onChange={(e) => setEditData({ ...editData, problem: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Technician</label>
                  <input
                    type="text"
                    value={editData.technicianName || ""}
                    onChange={(e) => setEditData({ ...editData, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Status</label>
                  <select
                    value={editData.jobStatus}
                    onChange={(e) => setEditData({ ...editData, jobStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="received">Received</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Job Number</p>
                  <p className="font-semibold">{invoice.jobNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Device Model</p>
                  <p className="font-semibold">{invoice.deviceModel || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-semibold">{invoice.serialNo || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IMEI</p>
                  <p className="font-semibold">{invoice.imei || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Problem</p>
                  <p className="font-semibold">{invoice.problem || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Technician</p>
                  <p className="font-semibold">{invoice.technicianName || "-"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <Wrench size={20} />
              Items & Services
            </h2>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Description</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold">Qty</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold">Rate</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-3">{item.description}</td>
                    <td className="py-3 px-3 text-right">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{formatINR(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <CreditCard size={20} />
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatINR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Service Charge</span>
                <span className="font-semibold">{formatINR(invoice.serviceCharge)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                <span className="font-semibold">{formatINR(invoice.taxAmount)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">
                    -{formatINR(invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b-2 border-blue-900">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-900">
                  {formatINR(invoice.total)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold text-green-600">
                  {formatINR(invoice.paid)}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-red-50 -mx-3 px-3 rounded">
                <span className="font-bold">Balance</span>
                <span className="font-bold text-red-600">
                  {formatINR(invoice.balance)}
                </span>
              </div>
            </div>
            
            {Number(invoice.balance) > 0 && isAdmin && (
              <button
                onClick={recordPayment}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Record Payment
              </button>
            )}
            {Number(invoice.balance) > 0 && !isAdmin && (
              <div className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border text-sm">
                <Shield size={16} />
                Record Payment (Admin only)
              </div>
            )}
          </div>

          {invoice.warrantyDays && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
                <Calendar size={20} />
                Warranty
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{invoice.warrantyDays} days</span>
                </div>
                {invoice.warrantyExpiry && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires</span>
                    <span className="font-semibold">
                      {formatShortDate(invoice.warrantyExpiry)}
                    </span>
                  </div>
                )}
                {invoice.warrantyExpiry && new Date(invoice.warrantyExpiry) > new Date() ? (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                    <CheckCircle size={14} />
                    Warranty Active
                  </p>
                ) : (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                    <AlertCircle size={14} />
                    Warranty Expired
                  </p>
                )}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2 text-blue-900">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
                <Clock size={20} />
                Payment History
              </h2>
              <div className="space-y-2">
                {invoice.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                      <p className="text-xs capitalize text-gray-600">{p.method}</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatINR(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editMode && isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {isAdmin ? (
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Delete Invoice
            </button>
          ) : (
            <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border text-sm text-center flex items-center justify-center gap-2">
              <Shield size={16} />
              Delete Invoice (Admin only)
            </div>
          )}
        </div>
      </div>

      {showWhatsappModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">WhatsApp Message Preview</h2>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowWhatsappModal(false);
                  sendViaWhatsapp();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send size={16} />
                Send via WhatsApp
              </button>
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
