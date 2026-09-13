export function formatINR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0.00";
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateInvoiceNumber(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `EC${String(year).slice(-2)}${month}${day}${seq}`;
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const JOB_STATUSES = [
  { value: "received", label: "Received", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "delivered", label: "Delivered", color: "bg-purple-100 text-purple-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-red-100 text-red-800" },
  { value: "partial", label: "Partial", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
] as const;

export function getStatusStyle(type: "job" | "payment", value: string) {
  const list = type === "job" ? JOB_STATUSES : PAYMENT_STATUSES;
  return list.find((s) => s.value === value) || { label: value, color: "bg-gray-100 text-gray-800" };
}
