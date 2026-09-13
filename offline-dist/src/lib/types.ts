export interface InvoiceItemData {
  description: string;
  quantity: number;
  rate: number | string;
  amount: number | string;
}

export interface InvoiceWithItems {
  id: number;
  invoiceNo: string;
  date: Date;
  customerId: number | null;
  customerName: string;
  mobile: string;
  jobNo: string;
  deviceModel: string | null;
  serialNo: string | null;
  imei: string | null;
  problem: string | null;
  technicianId: number | null;
  technicianName: string | null;
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
  warrantyDays: number | null;
  warrantyExpiry: Date | null;
  notes: string | null;
  createdAt: Date;
  items: InvoiceItemData[];
}
