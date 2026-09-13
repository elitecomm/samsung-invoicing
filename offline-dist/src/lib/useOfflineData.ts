"use client";

import { useEffect, useState } from "react";
import { offlineStore } from "./offlineStore";

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if offline version
    const offlineFlag = localStorage.getItem("is_offline_version") === "true" || 
                       localStorage.getItem("offline_mode") === "true" ||
                       process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
    
    // Also check if DATABASE_URL is dummy (for preview)
    // For offline build, we always enable offline
    if (typeof window !== "undefined") {
      // Auto-enable offline mode for offline version
      if (!localStorage.getItem("offline_initialized")) {
        offlineStore.enableOfflineMode();
      }
      setIsOffline(true); // Always true for offline build
    }
  }, []);

  return isOffline;
}

// Wrapper for fetch that uses offline store when offline
export async function offlineFetch(url: string, options?: RequestInit): Promise<any> {
  const isOffline = typeof window !== "undefined" && 
                   (localStorage.getItem("is_offline_version") === "true" || 
                    localStorage.getItem("offline_mode") === "true" ||
                    process.env.NEXT_PUBLIC_OFFLINE_MODE === "true" ||
                    true); // Force offline for offline build

  // If offline, handle locally
  if (isOffline) {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // Dashboard
    if (pathname === "/api/dashboard") {
      const period = searchParams.get("period") || "today";
      return {
        ok: true,
        json: async () => offlineStore.getDashboardStats(period),
      };
    }

    // Invoices list
    if (pathname === "/api/invoices" && (!options || options.method === "GET" || !options.method)) {
      let invoices = offlineStore.getInvoices();
      
      // Apply filters
      const search = searchParams.get("search");
      const jobStatus = searchParams.get("jobStatus");
      const paymentStatus = searchParams.get("paymentStatus");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");

      if (search) {
        const lower = search.toLowerCase();
        invoices = invoices.filter(
          (inv) =>
            inv.customerName.toLowerCase().includes(lower) ||
            inv.mobile.includes(search) ||
            inv.invoiceNo.toLowerCase().includes(lower) ||
            inv.jobNo.toLowerCase().includes(lower)
        );
      }
      if (jobStatus) {
        invoices = invoices.filter((inv) => inv.jobStatus === jobStatus);
      }
      if (paymentStatus) {
        invoices = invoices.filter((inv) => inv.paymentStatus === paymentStatus);
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        invoices = invoices.filter((inv) => new Date(inv.date) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo + "T23:59:59");
        invoices = invoices.filter((inv) => new Date(inv.date) <= to);
      }

      invoices = invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        ok: true,
        json: async () => ({ invoices, total: invoices.length }),
      };
    }

    // Create invoice
    if (pathname === "/api/invoices" && options?.method === "POST") {
      const body = JSON.parse(options.body as string);
      const newInvoice = offlineStore.saveInvoice(body);
      return {
        ok: true,
        json: async () => newInvoice,
      };
    }

    // Single invoice
    const invoiceIdMatch = pathname.match(/\/api\/invoices\/(\d+)/);
    if (invoiceIdMatch) {
      const id = parseInt(invoiceIdMatch[1]);
      
      if (pathname.endsWith("/pdf")) {
        // For offline, return a simple PDF blob or mock
        return {
          ok: true,
          blob: async () => new Blob(["Offline PDF - Use browser print"], { type: "application/pdf" }),
        };
      }

      if (!options || options.method === "GET" || !options.method) {
        const invoice = offlineStore.getInvoiceById(id);
        if (!invoice) {
          return { ok: false, json: async () => ({ error: "Not found" }) };
        }
        return {
          ok: true,
          json: async () => invoice,
        };
      }

      if (options.method === "PUT") {
        const body = JSON.parse(options.body as string);
        const updated = offlineStore.updateInvoice(id, body);
        return {
          ok: !!updated,
          json: async () => updated || { error: "Not found" },
        };
      }

      if (options.method === "DELETE") {
        const success = offlineStore.deleteInvoice(id);
        return {
          ok: success,
          json: async () => ({ success }),
        };
      }
    }

    // Customers
    if (pathname === "/api/customers") {
      if (!options || options.method === "GET" || !options.method) {
        const search = searchParams.get("search") || undefined;
        const customers = offlineStore.getCustomers(search);
        return {
          ok: true,
          json: async () => ({ customers }),
        };
      }
      if (options.method === "POST") {
        const body = JSON.parse(options.body as string);
        const customer = offlineStore.saveCustomer(body);
        return {
          ok: true,
          json: async () => customer,
        };
      }
    }

    // Reports
    if (pathname === "/api/reports") {
      const type = searchParams.get("type") || "daily";
      const dateFrom = searchParams.get("dateFrom") || new Date().toISOString().slice(0, 10);
      const dateTo = searchParams.get("dateTo") || new Date().toISOString().slice(0, 10);
      const report = offlineStore.getReports(type, dateFrom, dateTo);
      return {
        ok: true,
        json: async () => report,
      };
    }

    // Settings
    if (pathname === "/api/settings") {
      if (!options || options.method === "GET" || !options.method) {
        const settings = offlineStore.getSettings();
        return {
          ok: true,
          json: async () => ({ settings }),
        };
      }
      if (options.method === "PUT") {
        const body = JSON.parse(options.body as string);
        offlineStore.saveSetting(body.key, body.value);
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }
    }

    // Auth - always works offline
    if (pathname === "/api/auth/me") {
      // Try to get from cookie/localStorage
      const token = localStorage.getItem("offline_auth_token");
      if (token) {
        try {
          const user = JSON.parse(atob(token));
          return { ok: true, json: async () => ({ user }) };
        } catch {}
      }
      return { ok: false, status: 401, json: async () => ({ user: null }) };
    }

    if (pathname === "/api/auth/login" && options?.method === "POST") {
      const body = JSON.parse(options.body as string);
      const { username, password } = body;
      // Simple validation for offline
      const normalizedUser = username.trim().toLowerCase();
      let role: "admin" | "user" | null = null;
      if (normalizedUser === "admin" && (password === "admin123" || password === "admin")) {
        role = "admin";
      } else if (normalizedUser === "user" && (password === "user123" || password === "user")) {
        role = "user";
      }

      if (!role) {
        return { ok: false, status: 401, json: async () => ({ error: "Invalid credentials" }) };
      }

      const user = { username: normalizedUser, role };
      const token = btoa(JSON.stringify(user));
      localStorage.setItem("offline_auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      document.cookie = `samsung_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `auth_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `auth_user=${normalizedUser}; path=/; max-age=${60 * 60 * 24 * 7}`;

      return {
        ok: true,
        json: async () => ({ user, token, message: "Login successful" }),
      };
    }

    if (pathname === "/api/auth/logout") {
      localStorage.removeItem("offline_auth_token");
      localStorage.removeItem("auth_user");
      document.cookie = "samsung_auth=; path=/; max-age=0";
      document.cookie = "auth_role=; path=/; max-age=0";
      document.cookie = "auth_user=; path=/; max-age=0";
      return { ok: true, json: async () => ({ message: "Logged out" }) };
    }

    // Fallback to real fetch
    return fetch(url, options);
  }

  // Online mode - real fetch
  return fetch(url, options);
}
