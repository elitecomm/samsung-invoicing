"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Calculator, UserSearch } from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
}

export default function NewInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    mobile: "",
    jobNo: "",
    deviceModel: "",
    serialNo: "",
    imei: "",
    problem: "",
    technicianName: "",
    jobStatus: "received",
    serviceCharge: 0,
    taxRate: 18,
    discount: 0,
    paid: 0,
    warrantyDays: 30,
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Fetch customers for autocomplete
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(console.error);
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobile.includes(customerSearch)
  );

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    
    if (field === "rate" || field === "quantity") {
      newItems[idx].amount = newItems[idx].rate * newItems[idx].quantity;
    }
    
    setItems(newItems);
  };

  const selectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      mobile: customer.mobile,
    });
    setShowCustomerSearch(false);
    setCustomerSearch("");
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxableAmount = subtotal + formData.serviceCharge - formData.discount;
  const taxAmount = (taxableAmount * formData.taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const balance = Math.max(0, total - formData.paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.mobile || !formData.jobNo) {
      alert("Please fill in customer name, mobile, and job number");
      return;
    }

    const validItems = items.filter((item) => item.description && item.amount > 0);
    if (validItems.length === 0) {
      alert("Please add at least one item with description and amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: validItems,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.[0]?.message || "Failed to save");
      }

      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReverseCalculate = () => {
    const totalStr = prompt(
      "Enter the final total amount (including tax) to reverse-calculate:",
      total.toFixed(2)
    );
    if (!totalStr) return;
    
    const targetTotal = parseFloat(totalStr);
    if (isNaN(targetTotal)) return;

    // Reverse calculate: targetTotal = (subtotal + serviceCharge - discount) * (1 + taxRate/100)
    const taxableBase = targetTotal / (1 + formData.taxRate / 100);
    const newSubtotal = taxableBase - formData.serviceCharge + formData.discount;
    
    // Distribute proportionally across items
    const currentSubtotal = subtotal || 1;
    const newItems = items.map((item) => {
      const ratio = item.amount / currentSubtotal;
      const newAmount = newSubtotal * ratio;
      return {
        ...item,
        amount: newAmount,
        rate: newAmount / item.quantity,
      };
    });
    
    setItems(newItems);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-600 mt-1">Create a new tax invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setCustomerSearch(e.target.value);
                }}
                onFocus={() => setShowCustomerSearch(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {showCustomerSearch && filteredCustomers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {filteredCustomers.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.mobile}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Number *
              </label>
              <input
                type="text"
                value={formData.jobNo}
                onChange={(e) => setFormData({ ...formData, jobNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Model
              </label>
              <input
                type="text"
                value={formData.deviceModel}
                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Samsung Galaxy S23"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serialNo}
                onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IMEI Number
              </label>
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Description
              </label>
              <textarea
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Name
              </label>
              <input
                type="text"
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Status
              </label>
              <select
                value={formData.jobStatus}
                onChange={(e) => setFormData({ ...formData, jobStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="received">Received</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900 border-b pb-2 flex-1">
              Invoice Items (Parts & Services)
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Part or service description"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="w-full p-2 text-red-600 hover:bg-red-50 rounded"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Charges */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2">
            Charges & Tax
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Charge (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.serviceCharge}
                onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty (Days)
              </label>
              <input
                type="number"
                value={formData.warrantyDays}
                onChange={(e) => setFormData({ ...formData, warrantyDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Calculator size={18} />
                Calculation Summary
              </h3>
              <button
                type="button"
                onClick={handleReverseCalculate}
                className="text-sm px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100"
              >
                Reverse Calculate from Total
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Subtotal:</span>{" "}
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Service Charge:</span>{" "}
                <span className="font-semibold">₹{formData.serviceCharge.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Tax ({formData.taxRate}%):</span>{" "}
                <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Discount:</span>{" "}
                <span className="font-semibold">-₹{formData.discount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>{" "}
                <span className="font-bold text-blue-900">₹{total.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Paid:</span>{" "}
                <span className="font-semibold">₹{formData.paid.toFixed(2)}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-gray-600">Balance:</span>{" "}
                <span className="font-bold text-red-600">₹{balance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Any additional notes for this invoice..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
