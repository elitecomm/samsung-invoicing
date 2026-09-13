// Offline Store - Works without DATABASE_URL, uses localStorage
// For true offline version, all data is stored in browser

export interface OfflineInvoice {
  id: number;
  invoiceNo: string;
  date: string;
  customerId?: number | null;
  customerName: string;
  mobile: string;
  jobNo: string;
  deviceModel?: string;
  serialNo?: string;
  imei?: string;
  problem?: string;
  technicianId?: number | null;
  technicianName?: string;
  jobStatus: "received" | "in_progress" | "completed" | "delivered" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid";
  subtotal: string;
  serviceCharge: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  total: string;
  paid: string;
  balance: string;
  warrantyDays: number;
  warrantyExpiry?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OfflineInvoiceItem[];
  payments?: any[];
}

export interface OfflineInvoiceItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  rate: string;
  amount: string;
  createdAt: string;
}

export interface OfflineCustomer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineSettings {
  [key: string]: string;
}

const STORAGE_KEYS = {
  invoices: "offline_invoices",
  customers: "offline_customers",
  settings: "offline_settings",
  nextInvoiceId: "offline_next_invoice_id",
  nextCustomerId: "offline_next_customer_id",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: any) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

// Default settings for offline
const DEFAULT_SETTINGS: OfflineSettings = {
  company_name: "Elite Communication",
  brand_name: "Samsung Service Center",
  address: "Varanasi, Uttar Pradesh",
  contact: "9569894030, 9452134567",
  email: "elitecomm.varanasi@gmail.com",
  gst_no: "09ABCDE1234F1Z5",
  tax_rate: "18",
  warranty_days: "30",
  whatsapp_message_template: `Hello {customer_name},

Your device repair invoice is ready!

Company: {company_name}
Invoice No: {invoice_no}
Job No: {job_no}
Device: {device}
Total: ₹{total}
Paid: ₹{paid}
Balance: ₹{balance}
Warranty: {warranty_days} days till {warranty_expiry}

Contact: {contact}
Thank you for choosing {company_name}!`,
};

// Sample data for offline demo
const SAMPLE_CUSTOMERS: OfflineCustomer[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    mobile: "9876543210",
    email: "rahul@example.com",
    address: "Sigra, Varanasi",
    gstNo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Priya Singh",
    mobile: "9876543211",
    email: "priya@example.com",
    address: "Lanka, Varanasi",
    gstNo: "09ABCDE1234F1Z5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SAMPLE_INVOICES: OfflineInvoice[] = [
  {
    id: 1,
    invoiceNo: "EC260913001",
    date: new Date().toISOString(),
    customerId: 1,
    customerName: "Rahul Sharma",
    mobile: "9876543210",
    jobNo: "JOB001",
    deviceModel: "Samsung Galaxy S23",
    serialNo: "SN123456",
    imei: "123456789012345",
    problem: "Screen broken",
    technicianId: null,
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
    warrantyExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Screen replaced, tested OK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 1,
        invoiceId: 1,
        description: "Samsung S23 Display Replacement",
        quantity: 1,
        rate: "2000.00",
        amount: "2000.00",
        createdAt: new Date().toISOString(),
      },
    ],
    payments: [],
  },
];

export const offlineStore = {
  // Check if offline mode
  isOfflineMode(): boolean {
    if (!isBrowser()) return false;
    // Offline if explicitly set or if no DATABASE_URL (we detect via flag)
    const offlineFlag = localStorage.getItem("offline_mode");
    const publicOffline = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
    return offlineFlag === "true" || publicOffline || true; // Default to true for offline version
  },

  enableOfflineMode() {
    if (!isBrowser()) return;
    localStorage.setItem("offline_mode", "true");
    // Initialize with sample data if empty
    if (!localStorage.getItem(STORAGE_KEYS.invoices)) {
      safeSave(STORAGE_KEYS.invoices, SAMPLE_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.customers)) {
      safeSave(STORAGE_KEYS.customers, SAMPLE_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
      safeSave(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.nextInvoiceId)) {
      safeSave(STORAGE_KEYS.nextInvoiceId, 2);
    }
    if (!localStorage.getItem(STORAGE_KEYS.nextCustomerId)) {
      safeSave(STORAGE_KEYS.nextCustomerId, 3);
    }
  },

  // Invoices
  getInvoices(): OfflineInvoice[] {
    const invoices = safeParse<OfflineInvoice[]>(STORAGE_KEYS.invoices, []);
    // Initialize with sample if empty
    if (invoices.length === 0 && isBrowser()) {
      const hasInitialized = localStorage.getItem("offline_initialized");
      if (!hasInitialized) {
        safeSave(STORAGE_KEYS.invoices, SAMPLE_INVOICES);
        safeSave(STORAGE_KEYS.customers, SAMPLE_CUSTOMERS);
        safeSave(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
        safeSave(STORAGE_KEYS.nextInvoiceId, 2);
        safeSave(STORAGE_KEYS.nextCustomerId, 3);
        localStorage.setItem("offline_initialized", "true");
        return SAMPLE_INVOICES;
      }
    }
    return invoices;
  },

  getInvoiceById(id: number): OfflineInvoice | null {
    const invoices = this.getInvoices();
    return invoices.find((inv) => inv.id === id) || null;
  },

  saveInvoice(invoiceData: Partial<OfflineInvoice> & { items: any[] }): OfflineInvoice {
    const invoices = this.getInvoices();
    const nextId = safeParse<number>(STORAGE_KEYS.nextInvoiceId, 1);

    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const serviceCharge = (invoiceData as any).serviceCharge || 0;
    const discount = (invoiceData as any).discount || 0;
    const taxRate = (invoiceData as any).taxRate || 18;
    const paid = (invoiceData as any).paid || 0;

    const taxableAmount = subtotal + serviceCharge - discount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;
    const balance = Math.max(0, total - paid);

    let paymentStatus: "pending" | "partial" | "paid" = "pending";
    if (paid >= total) paymentStatus = "paid";
    else if (paid > 0) paymentStatus = "partial";

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const seq = String(invoices.length + 1).padStart(3, "0");
    const invoiceNo = `EC${String(year).slice(-2)}${month}${day}${seq}`;

    const warrantyDays = (invoiceData as any).warrantyDays || 30;
    const warrantyExpiry = warrantyDays ? new Date(now.getTime() + warrantyDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const newInvoice: OfflineInvoice = {
      id: nextId,
      invoiceNo,
      date: now.toISOString(),
      customerId: null,
      customerName: (invoiceData as any).customerName,
      mobile: (invoiceData as any).mobile,
      jobNo: (invoiceData as any).jobNo,
      deviceModel: (invoiceData as any).deviceModel || "",
      serialNo: (invoiceData as any).serialNo || "",
      imei: (invoiceData as any).imei || "",
      problem: (invoiceData as any).problem || "",
      technicianId: null,
      technicianName: (invoiceData as any).technicianName || "",
      jobStatus: (invoiceData as any).jobStatus || "received",
      paymentStatus,
      subtotal: subtotal.toFixed(2),
      serviceCharge: serviceCharge.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      balance: balance.toFixed(2),
      warrantyDays,
      warrantyExpiry,
      notes: (invoiceData as any).notes || "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: invoiceData.items.map((item: any, idx: number) => ({
        id: idx + 1,
        invoiceId: nextId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate.toFixed(2),
        amount: item.amount.toFixed(2),
        createdAt: now.toISOString(),
      })),
      payments: [],
    };

    invoices.push(newInvoice);
    safeSave(STORAGE_KEYS.invoices, invoices);
    safeSave(STORAGE_KEYS.nextInvoiceId, nextId + 1);

    // Also save customer
    this.saveCustomer({
      name: newInvoice.customerName,
      mobile: newInvoice.mobile,
    });

    return newInvoice;
  },

  updateInvoice(id: number, updates: Partial<OfflineInvoice>): OfflineInvoice | null {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) return null;

    const updated = { ...invoices[idx], ...updates, updatedAt: new Date().toISOString() };
    
    // Recalculate if paid changed
    if (updates.paid !== undefined) {
      const total = parseFloat(updated.total);
      const paid = parseFloat(updates.paid as any);
      const balance = Math.max(0, total - paid);
      updated.paid = paid.toFixed(2);
      updated.balance = balance.toFixed(2);
      if (paid >= total) updated.paymentStatus = "paid";
      else if (paid > 0) updated.paymentStatus = "partial";
      else updated.paymentStatus = "pending";
    }

    invoices[idx] = updated;
    safeSave(STORAGE_KEYS.invoices, invoices);
    return updated;
  },

  deleteInvoice(id: number): boolean {
    const invoices = this.getInvoices();
    const filtered = invoices.filter((inv) => inv.id !== id);
    if (filtered.length === invoices.length) return false;
    safeSave(STORAGE_KEYS.invoices, filtered);
    return true;
  },

  // Customers
  getCustomers(search?: string): OfflineCustomer[] {
    let customers = safeParse<OfflineCustomer[]>(STORAGE_KEYS.customers, []);
    if (customers.length === 0 && isBrowser()) {
      const hasInitialized = localStorage.getItem("offline_initialized");
      if (!hasInitialized) {
        safeSave(STORAGE_KEYS.customers, SAMPLE_CUSTOMERS);
        safeSave(STORAGE_KEYS.invoices, SAMPLE_INVOICES);
        safeSave(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
        localStorage.setItem("offline_initialized", "true");
        customers = SAMPLE_CUSTOMERS;
      }
    }
    if (search) {
      const lower = search.toLowerCase();
      return customers.filter((c) => c.name.toLowerCase().includes(lower) || c.mobile.includes(search));
    }
    return customers;
  },

  saveCustomer(customer: { name: string; mobile: string; email?: string; address?: string; gstNo?: string }): OfflineCustomer {
    const customers = this.getCustomers();
    const existing = customers.find((c) => c.mobile === customer.mobile);
    if (existing) {
      const updated = { ...existing, ...customer, updatedAt: new Date().toISOString() };
      const idx = customers.findIndex((c) => c.id === existing.id);
      customers[idx] = updated;
      safeSave(STORAGE_KEYS.customers, customers);
      return updated;
    }

    const nextId = safeParse<number>(STORAGE_KEYS.nextCustomerId, 1);
    const newCustomer: OfflineCustomer = {
      id: nextId,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      address: customer.address || "",
      gstNo: customer.gstNo || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    safeSave(STORAGE_KEYS.customers, customers);
    safeSave(STORAGE_KEYS.nextCustomerId, nextId + 1);
    return newCustomer;
  },

  // Settings
  getSettings(): OfflineSettings {
    return safeParse<OfflineSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  },

  saveSetting(key: string, value: string) {
    const settings = this.getSettings();
    settings[key] = value;
    safeSave(STORAGE_KEYS.settings, settings);
  },

  // Dashboard stats
  getDashboardStats(period: string = "today") {
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

    // Daily revenue for last 7 days
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

  // Reports
  getReports(type: string, dateFrom: string, dateTo: string) {
    const invoices = this.getInvoices();
    const from = new Date(dateFrom);
    const to = new Date(dateTo + "T23:59:59");

    const filtered = invoices.filter((inv) => {
      const d = new Date(inv.date);
      return d >= from && d <= to;
    });

    const grouped: Record<string, { invoiceCount: number; totalRevenue: number; totalCollected: number; totalPending: number; totalTax: number }> = {};

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

  // Export all data
  exportAllData() {
    return {
      invoices: this.getInvoices(),
      customers: this.getCustomers(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  },

  importAllData(data: any) {
    if (data.invoices) safeSave(STORAGE_KEYS.invoices, data.invoices);
    if (data.customers) safeSave(STORAGE_KEYS.customers, data.customers);
    if (data.settings) safeSave(STORAGE_KEYS.settings, data.settings);
  },

  clearAllData() {
    if (!isBrowser()) return;
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("offline_initialized");
    localStorage.removeItem("offline_mode");
  },
};
