"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, Users, BarChart3, Settings, PlusCircle, LogOut, Shield, User as UserIcon, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import type { Role } from "@/lib/auth";

interface MenuItem {
  href: string;
  icon: any;
  label: string;
  roles: Role[];
  description?: string;
}

const menuItems: MenuItem[] = [
  { href: "/", icon: Home, label: "Dashboard", roles: ["admin", "user"], description: "Overview" },
  { href: "/invoices/new", icon: PlusCircle, label: "New Invoice", roles: ["admin", "user"], description: "Create invoice" },
  { href: "/invoices", icon: FileText, label: "All Invoices", roles: ["admin", "user"], description: "View invoices" },
  { href: "/customers", icon: Users, label: "Customers", roles: ["admin"], description: "Admin only" },
  { href: "/reports", icon: BarChart3, label: "Reports", roles: ["admin"], description: "Admin only" },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["admin"], description: "Admin only" },
  { href: "/offline", icon: WifiOff, label: "Offline Mode", roles: ["admin", "user"], description: "Offline version" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout, isAdmin } = useAuth();

  const filteredItems = menuItems.filter((item) => !role || item.roles.includes(role));

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">Samsung Service</h1>
        <p className="text-sm text-blue-200">Invoicing System</p>
        
        {user && (
          <div className="mt-4 p-3 bg-blue-800/50 rounded-lg border border-blue-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? "bg-amber-500" : "bg-green-500"}`}>
                {isAdmin ? <Shield size={16} className="text-white" /> : <UserIcon size={16} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate capitalize">{user.username}</p>
                <p className="text-xs text-blue-200 capitalize flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${isAdmin ? "bg-amber-400" : "bg-green-400"}`}></span>
                  {role} {isAdmin ? "• Full Access" : "• Limited"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="mb-2 px-2">
          <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
            {isAdmin ? "Admin Mode - All Access" : "User Mode - Limited Access"}
          </p>
        </div>
        
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isAdminOnly = item.roles.length === 1 && item.roles[0] === "admin";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                isActive
                  ? "bg-white text-blue-900 font-semibold shadow-sm"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              )}
            >
              <Icon size={20} className={isActive ? "text-blue-900" : ""} />
              <div className="flex-1">
                <span className="text-sm">{item.label}</span>
                {isAdminOnly && !isActive && (
                  <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded">ADMIN</span>
                )}
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )}
            </Link>
          );
        })}

        {role === "user" && (
          <div className="mt-6 p-3 bg-blue-800/30 rounded-lg border border-blue-700/30">
            <p className="text-xs font-semibold text-blue-200 mb-2 flex items-center gap-1.5">
              <UserIcon size={12} /> User Permissions
            </p>
            <ul className="space-y-1 text-[11px] text-blue-300">
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> View Dashboard</li>
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Create Invoices</li>
              <li className="flex items-center gap-1.5"><span className="text-green-400">✓</span> View Invoices</li>
              <li className="flex items-center gap-1.5 opacity-60"><span className="text-red-300">✗</span> Customers, Reports, Settings</li>
            </ul>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-blue-700 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white transition-colors border border-red-500/20 hover:border-red-600 text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <div className="text-xs text-blue-300/70 px-2">
          <p className="font-medium text-blue-200">Elite Communication</p>
          <p>Varanasi • Samsung Service</p>
          <p className="mt-1 text-[10px]">Role: <span className="capitalize font-semibold">{role}</span> Mode Active</p>
        </div>
      </div>
    </aside>
  );
}
