"use client";

import { useAuth } from "@/components/AuthProvider";
import { ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/lib/auth";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="text-red-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
            <Lock size={14} />
            Required role: <span className="font-semibold">{allowedRoles.join(" or ")}</span> — Your role: <span className="font-semibold capitalize">{role || "none"}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/invoices"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              View Invoices
            </Link>
          </div>
          {role === "user" && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
              <h3 className="font-semibold text-blue-900 mb-2">User Mode Permissions:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>✅ View Dashboard</li>
                <li>✅ Create New Invoice</li>
                <li>✅ View All Invoices</li>
                <li>❌ Manage Customers (Admin only)</li>
                <li>❌ View Reports (Admin only)</li>
                <li>❌ Manage Settings (Admin only)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
