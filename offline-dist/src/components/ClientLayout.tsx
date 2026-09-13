"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { offlineStore } from "@/lib/offlineStore";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Auto-enable offline version
    if (typeof window !== "undefined") {
      const isOfflineVersion = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true" || 
                              !process.env.NEXT_PUBLIC_OFFLINE_MODE; // Default to offline-capable
      
      // For offline build, always enable
      if (process.env.NEXT_PUBLIC_OFFLINE_MODE === "true") {
        if (!localStorage.getItem("offline_initialized")) {
          offlineStore.enableOfflineMode();
          localStorage.setItem("is_offline_version", "true");
          localStorage.setItem("offline_mode", "true");
          console.log("✅ Offline mode auto-enabled with sample data");
        }
      } else {
        // Even for online version, enable offline as fallback
        if (!localStorage.getItem("offline_initialized")) {
          // Don't auto-enable, but prepare
          console.log("Offline store ready as fallback");
        }
      }

      // Patch fetch to use offline store when needed
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
        
        // Check if should use offline
        const shouldUseOffline = localStorage.getItem("is_offline_version") === "true" || 
                                localStorage.getItem("offline_mode") === "true" ||
                                process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";

        if (shouldUseOffline && url.includes("/api/") && !url.includes("/api/auth")) {
          try {
            const { offlineFetch } = await import("@/lib/useOfflineData");
            const result = await offlineFetch(url, init);
            // Convert offlineFetch result to Response-like
            if (result.json) {
              const data = await result.json();
              return new Response(JSON.stringify(data), {
                status: result.ok ? 200 : result.status || 400,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (result.blob) {
              const blob = await result.blob();
              return new Response(blob, {
                status: 200,
                headers: { "Content-Type": "application/pdf" },
              });
            }
            return result as any;
          } catch (e) {
            console.error("Offline fetch failed, falling back to original", e);
            return originalFetch(input, init);
          }
        }

        return originalFetch(input, init);
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
