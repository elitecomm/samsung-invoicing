import { pgTable, serial, varchar, text, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

// Enums for job status and payment status
export const jobStatusEnum = pgEnum("job_status", [
  "received",
  "in_progress",
  "completed",
  "delivered",
  "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "paid"
]);

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  gstNo: varchar("gst_no", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Technicians table
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  specialization: varchar("specialization", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: varchar("invoice_no", { length: 50 }).notNull().unique(),
  date: timestamp("date").defaultNow().notNull(),
  
  // Customer info
  customerId: integer("customer_id").references(() => customers.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  
  // Job details
  jobNo: varchar("job_no", { length: 100 }).notNull(),
  deviceModel: varchar("device_model", { length: 255 }),
  serialNo: varchar("serial_no", { length: 255 }),
  imei: varchar("imei", { length: 50 }),
  problem: text("problem"),
  
  // Technician assignment
  technicianId: integer("technician_id").references(() => technicians.id),
  technicianName: varchar("technician_name", { length: 255 }),
  
  // Status
  jobStatus: jobStatusEnum("job_status").default("received").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  
  // Financial
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  serviceCharge: numeric("service_charge", { precision: 10, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("18.00").notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).default("0").notNull(),
  paid: numeric("paid", { precision: 10, scale: 2 }).default("0").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Warranty
  warrantyDays: integer("warranty_days").default(30),
  warrantyExpiry: timestamp("warranty_expiry"),
  
  // Notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice Items table (for multiple line items)
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }).default("0").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table (to track multiple payments)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).default("cash").notNull(), // cash, upi, card, etc.
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table (for storing configuration)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (for Admin and General Staff role management)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(), // Stores hashed password
  role: varchar("role", { length: 20 }).default("staff").notNull(), // 'admin' or 'staff'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});