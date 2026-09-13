"use client";

import { useEffect, useState } from "react";
import { offlineStore } from "@/lib/offlineStore";
import { Shield, User, Database, WifiOff, Download, Trash2, Upload, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem("is_offline_version") === "true" || localStorage.getItem("offline_mode") === "true";
    setIsOfflineEnabled(flag);
    if (flag) {
      setStats({
        invoices: offlineStore.getInvoices().length,
        customers: offlineStore.getCustomers().length,
      });
    }
  }, []);

  const enableOffline = () => {
    localStorage.setItem("is_offline_version", "true");
    localStorage.setItem("offline_mode", "true");
    offlineStore.enableOfflineMode();
    setIsOfflineEnabled(true);
    setStats({
      invoices: offlineStore.getInvoices().length,
      customers: offlineStore.getCustomers().length,
    });
    alert("✅ Offline mode enabled! Sample data loaded. You can now use the app without database.");
  };

  const clearOfflineData = () => {
    if (confirm("Clear all offline data? This cannot be undone.")) {
      offlineStore.clearAllData();
      setStats({ invoices: 0, customers: 0 });
      alert("Cleared!");
    }
  };

  const exportData = () => {
    const data = offlineStore.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offline_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        offlineStore.importAllData(data);
        setStats({
          invoices: offlineStore.getInvoices().length,
          customers: offlineStore.getCustomers().length,
        });
        alert("✅ Data imported!");
      } catch {
        alert("❌ Invalid file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <WifiOff className="text-blue-600" />
          Offline Version
          {isOfflineEnabled && <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">Enabled</span>}
        </h1>
        <p className="text-gray-600 mt-2">Run Samsung Invoicing without database or internet</p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <div className={`rounded-xl p-6 border-2 ${isOfflineEnabled ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOfflineEnabled ? "bg-green-500" : "bg-amber-500"}`}>
              {isOfflineEnabled ? <CheckCircle className="text-white" size={24} /> : <Database className="text-white" size={24} />}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${isOfflineEnabled ? "text-green-900" : "text-amber-900"}`}>
                {isOfflineEnabled ? "✅ Offline Mode Active" : "⚠️ Offline Mode Not Enabled"}
              </h2>
              <p className={`text-sm mt-1 ${isOfflineEnabled ? "text-green-700" : "text-amber-700"}`}>
                {isOfflineEnabled
                  ? `Offline storage active with ${stats?.invoices || 0} invoices and ${stats?.customers || 0} customers. All data is in localStorage. No DATABASE_URL needed.`
                  : "Enable offline mode to use the app without PostgreSQL. Sample data will be loaded."}
              </p>
              <div className="flex gap-2 mt-4">
                {!isOfflineEnabled ? (
                  <button onClick={enableOffline} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Enable Offline Mode
                  </button>
                ) : (
                  <Link href="/" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                    Go to Dashboard
                  </Link>
                )}
                <button onClick={() => setShowData(!showData)} className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
                  {showData ? "Hide" : "Show"} Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {showData && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Offline Storage Details</h3>
            <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded-lg">
              <div>offline_invoices: {stats?.invoices || 0} items</div>
              <div>offline_customers: {stats?.customers || 0} items</div>
              <div>is_offline_version: {localStorage.getItem("is_offline_version")}</div>
              <div>offline_mode: {localStorage.getItem("offline_mode")}</div>
              <div>auth_user: {localStorage.getItem("auth_user")?.slice(0, 50)}...</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={exportData} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm">
                <Download size={16} /> Export Backup
              </button>
              <label className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm cursor-pointer">
                <Upload size={16} /> Import Backup
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={clearOfflineData} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
                <Trash2 size={16} /> Clear All
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">How Offline Version Works</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium flex items-center gap-2"><Shield size={16} className="text-amber-600" /> Admin Mode</h4>
              <p className="text-sm text-gray-600 mt-1">Full access: Dashboard, Invoices, Customers, Reports, Settings</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">admin / admin123</code>
            </div>
            <div>
              <h4 className="font-medium flex items-center gap-2"><User size={16} className="text-green-600" /> User Mode</h4>
              <p className="text-sm text-gray-600 mt-1">Limited: Create, View, Dashboard only</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">user / user123</code>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Quick Start (No DB)</h4>
            <pre className="text-xs bg-blue-900 text-blue-100 p-3 rounded-lg mt-2 overflow-x-auto">
{`# No DATABASE_URL needed!
npm install
NEXT_PUBLIC_OFFLINE_MODE=true npm run dev
# Open http://localhost:3000
# Login: admin/admin123`}
            </pre>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Online vs Offline</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3">Feature</th>
                  <th className="text-left py-2 px-3">Online</th>
                  <th className="text-left py-2 px-3">Offline</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2 px-3">Database</td><td className="py-2 px-3">PostgreSQL</td><td className="py-2 px-3">localStorage</td></tr>
                <tr className="border-b"><td className="py-2 px-3">Internet</td><td className="py-2 px-3">Required</td><td className="py-2 px-3">Not after first load</td></tr>
                <tr className="border-b"><td className="py-2 px-3">Setup</td><td className="py-2 px-3">Needs DATABASE_URL</td><td className="py-2 px-3">None</td></tr>
                <tr className="border-b"><td className="py-2 px-3">Data</td><td className="py-2 px-3">Shared server</td><td className="py-2 px-3">Per browser</td></tr>
                <tr><td className="py-2 px-3">Auth</td><td className="py-2 px-3">Same</td><td className="py-2 px-3">Same</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
