"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Home, Users, BarChart3, Settings, PlusCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/invoices/new", icon: PlusCircle, label: "New Invoice" },
  { href: "/invoices", icon: FileText, label: "All Invoices" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">Samsung Service</h1>
        <p className="text-sm text-blue-200">Invoicing System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-white text-blue-900 font-semibold"
                  : "text-blue-100 hover:bg-blue-700"
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button Section */}
      <div className="p-4 border-t border-blue-700 space-y-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-200 hover:bg-red-600/20 hover:text-white transition-colors w-full font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        <div className="text-xs text-blue-200 pt-2 border-t border-blue-700/50">
          <p className="font-semibold">Elite Communication</p>
          <p>Varanasi</p>
        </div>
      </div>
    </aside>
  );
}