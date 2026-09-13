// Server-side offline store (in-memory) for when DATABASE_URL is not set
// This allows the app to run without a real database

interface Invoice {
  id: number;
  invoiceNo: string;
  date: Date;
  customerName: string;
  mobile: string;
  jobNo: string;
  deviceModel?: string;
  serialNo?: string;
  imei?: string;
  problem?: string;
  technicianName?: string;
  jobStatus: string;
  paymentStatus: string;
  subtotal: string;
  serviceCharge: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  total: string;
  paid: string;
  balance: string;
  warrantyDays: number;
  warrantyExpiry?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: any[];
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const globalStore = globalThis as any;

if (!globalStore.__offlineInvoices) {
  globalStore.__offlineInvoices = [
    {
      id: 1,
      invoiceNo: "EC260913001",
      date: new Date(),
      customerName: "Rahul Sharma",
      mobile: "9876543210",
      jobNo: "JOB001",
      deviceModel: "Samsung Galaxy S23",
      serialNo: "SN123456",
      imei: "123456789012345",
      problem: "Screen broken",
      technicianName: "Amit Kumar",
      jobStatus: "completed",
      paymentStatus: "paid",
      subtotal: "2000.00",
      serviceCharge: "200.00",
      taxRate: "18.00",
      taxAmount: "396.00",
      discount: "0.00",
      total: "2596.00",
      paid: "2596.00",
      balance: "0.00",
      warrantyDays: 30,
      warrantyExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "Screen replaced",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 1,
          invoiceId: 1,
          description: "Samsung S23 Display Replacement",
          quantity: 1,
          rate: "2000.00",
          amount: "2000.00",
          createdAt: new Date(),
        },
      ],
    },
  ];
  globalStore.__offlineCustomers = [
    {
      id: 1,
      name: "Rahul Sharma",
      mobile: "9876543210",
      email: "rahul@example.com",
      address: "Sigra, Varanasi",
      gstNo: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  globalStore.__offlineSettings = {
    company_name: "Elite Communication",
    brand_name: "Samsung Service Center",
    address: "Varanasi, Uttar Pradesh",
    contact: "9569894030",
    email: "elitecomm.varanasi@gmail.com",
    gst_no: "09ABCDE1234F1Z5",
    tax_rate: "18",
    warranty_days: "30",
    whatsapp_message_template: "Hello {customer_name}, Invoice {invoice_no} Total: ₹{total}",
  };
  globalStore.__offlineNextInvoiceId = 2;
  globalStore.__offlineNextCustomerId = 2;
}

export const serverOfflineStore = {
  getInvoices() {
    return globalStore.__offlineInvoices as Invoice[];
  },

  getInvoiceById(id: number) {
    return (globalStore.__offlineInvoices as Invoice[]).find((inv) => inv.id === id) || null;
  },

  createInvoice(data: any) {
    const invoices = globalStore.__offlineInvoices as Invoice[];
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const seq = String(invoices.length + 1).padStart(3, "0");
    const invoiceNo = `EC${String(year).slice(-2)}${month}${day}${seq}`;

    const subtotal = data.items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxableAmount = subtotal + (data.serviceCharge || 0) - (data.discount || 0);
    const taxAmount = (taxableAmount * (data.taxRate || 18)) / 100;
    const total = taxableAmount + taxAmount;
    const balance = Math.max(0, total - (data.paid || 0));

    let paymentStatus = data.paymentStatus || "pending";
    if ((data.paid || 0) >= total) paymentStatus = "paid";
    else if ((data.paid || 0) > 0) paymentStatus = "partial";

    const warrantyExpiry = data.warrantyDays
      ? new Date(now.getTime() + data.warrantyDays * 24 * 60 * 60 * 1000)
      : null;

    const newInvoice: Invoice = {
      id: globalStore.__offlineNextInvoiceId++,
      invoiceNo,
      date: now,
      customerName: data.customerName,
      mobile: data.mobile,
      jobNo: data.jobNo,
      deviceModel: data.deviceModel,
      serialNo: data.serialNo,
      imei: data.imei,
      problem: data.problem,
      technicianName: data.technicianName,
      jobStatus: data.jobStatus || "received",
      paymentStatus,
      subtotal: subtotal.toFixed(2),
      serviceCharge: (data.serviceCharge || 0).toFixed(2),
      taxRate: (data.taxRate || 18).toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discount: (data.discount || 0).toFixed(2),
      total: total.toFixed(2),
      paid: (data.paid || 0).toFixed(2),
      balance: balance.toFixed(2),
      warrantyDays: data.warrantyDays || 30,
      warrantyExpiry,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      items: data.items.map((item: any, idx: number) => ({
        id: idx + 1,
        invoiceId: globalStore.__offlineNextInvoiceId - 1,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate.toFixed(2),
        amount: item.amount.toFixed(2),
        createdAt: now,
      })),
    };

    invoices.push(newInvoice);

    // Also save customer
    const customers = globalStore.__offlineCustomers as Customer[];
    if (!customers.find((c) => c.mobile === data.mobile)) {
      customers.push({
        id: globalStore.__offlineNextCustomerId++,
        name: data.customerName,
        mobile: data.mobile,
        email: "",
        address: "",
        gstNo: "",
        createdAt: now,
        updatedAt: now,
      });
    }

    return newInvoice;
  },

  updateInvoice(id: number, updates: any) {
    const invoices = globalStore.__offlineInvoices as Invoice[];
    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) return null;

    const existing = invoices[idx];
    const updated = { ...existing, ...updates, updatedAt: new Date() };

    if (updates.paid !== undefined) {
      const total = parseFloat(existing.total);
      const paid = parseFloat(updates.paid);
      const balance = Math.max(0, total - paid);
      (updated as any).paid = paid.toFixed(2);
      (updated as any).balance = balance.toFixed(2);
      if (paid >= total) (updated as any).paymentStatus = "paid";
      else if (paid > 0) (updated as any).paymentStatus = "partial";
      else (updated as any).paymentStatus = "pending";
    }

    invoices[idx] = updated as Invoice;
    return updated;
  },

  deleteInvoice(id: number) {
    const invoices = globalStore.__offlineInvoices as Invoice[];
    const initialLength = invoices.length;
    globalStore.__offlineInvoices = invoices.filter((inv: Invoice) => inv.id !== id);
    return globalStore.__offlineInvoices.length < initialLength;
  },

  getCustomers(search?: string) {
    let customers = globalStore.__offlineCustomers as Customer[];
    if (search) {
      const lower = search.toLowerCase();
      customers = customers.filter((c) => c.name.toLowerCase().includes(lower) || c.mobile.includes(search));
    }
    return customers;
  },

  createCustomer(data: any) {
    const customers = globalStore.__offlineCustomers as Customer[];
    const existing = customers.find((c) => c.mobile === data.mobile);
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
      return existing;
    }

    const now = new Date();
    const newCustomer: Customer = {
      id: globalStore.__offlineNextCustomerId++,
      name: data.name,
      mobile: data.mobile,
      email: data.email || "",
      address: data.address || "",
      gstNo: data.gstNo || "",
      createdAt: now,
      updatedAt: now,
    };
    customers.push(newCustomer);
    return newCustomer;
  },

  getSettings() {
    return globalStore.__offlineSettings;
  },

  saveSetting(key: string, value: string) {
    globalStore.__offlineSettings[key] = value;
  },

  getDashboardStats(period: string) {
    const invoices = this.getInvoices();
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const filtered = invoices.filter((inv) => new Date(inv.date) >= startDate);

    const totalInvoices = filtered.length;
    const totalRevenue = filtered.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    const totalCollected = filtered.reduce((sum, inv) => sum + parseFloat(inv.paid), 0);
    const totalPending = filtered.reduce((sum, inv) => sum + parseFloat(inv.balance), 0);

    const jobStatusMap: Record<string, number> = {};
    const paymentStatusMap: Record<string, number> = {};

    filtered.forEach((inv) => {
      jobStatusMap[inv.jobStatus] = (jobStatusMap[inv.jobStatus] || 0) + 1;
      paymentStatusMap[inv.paymentStatus] = (paymentStatusMap[inv.paymentStatus] || 0) + 1;
    });

    const jobStatusStats = Object.entries(jobStatusMap).map(([status, count]) => ({ status, count }));
    const paymentStatusStats = Object.entries(paymentStatusMap).map(([status, count]) => ({ status, count }));

    const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const dailyMap: Record<string, { total: number; count: number }> = {};
    const chartDays = period === "year" ? 30 : period === "month" ? 30 : 7;
    const chartStart = new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000);

    invoices
      .filter((inv) => new Date(inv.date) >= chartStart)
      .forEach((inv) => {
        const dateStr = new Date(inv.date).toISOString().slice(0, 10);
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { total: 0, count: 0 };
        dailyMap[dateStr].total += parseFloat(inv.total);
        dailyMap[dateStr].count += 1;
      });

    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, total: data.total, count: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      totalInvoices,
      totalRevenue,
      totalCollected,
      totalPending,
      jobStatusStats,
      paymentStatusStats,
      recentInvoices,
      dailyRevenue,
    };
  },

  getReports(type: string, dateFrom: string, dateTo: string) {
    const invoices = this.getInvoices();
    const from = new Date(dateFrom);
    const to = new Date(dateTo + "T23:59:59");

    const filtered = invoices.filter((inv) => {
      const d = new Date(inv.date);
      return d >= from && d <= to;
    });

    const grouped: Record<string, any> = {};

    filtered.forEach((inv) => {
      let periodKey: string;
      const d = new Date(inv.date);
      if (type === "daily") {
        periodKey = d.toISOString().slice(0, 10);
      } else if (type === "monthly") {
        periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        periodKey = `${d.getFullYear()}`;
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { invoiceCount: 0, totalRevenue: 0, totalCollected: 0, totalPending: 0, totalTax: 0 };
      }
      grouped[periodKey].invoiceCount += 1;
      grouped[periodKey].totalRevenue += parseFloat(inv.total);
      grouped[periodKey].totalCollected += parseFloat(inv.paid);
      grouped[periodKey].totalPending += parseFloat(inv.balance);
      grouped[periodKey].totalTax += parseFloat(inv.taxAmount);
    });

    const data = Object.entries(grouped)
      .map(([period, stats]) => ({ period, ...stats }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const totals = data.reduce(
      (acc, curr) => ({
        invoiceCount: acc.invoiceCount + curr.invoiceCount,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalCollected: acc.totalCollected + curr.totalCollected,
        totalPending: acc.totalPending + curr.totalPending,
        totalTax: acc.totalTax + curr.totalTax,
      }),
      { invoiceCount: 0, totalRevenue: 0, totalCollected: 0, totalPending: 0, totalTax: 0 }
    );

    return { data, totals };
  },
};
