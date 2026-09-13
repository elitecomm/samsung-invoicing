"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AuthUser, Role } from "@/lib/auth";
import { getRolePermissions } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
  role: Role | null;
  permissions: ReturnType<typeof getRolePermissions> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        } else {
          // API returned 200 but no user -> clear
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } else {
        // 401 -> not authenticated, clear everything
        setUser(null);
        localStorage.removeItem("auth_user");
        // Also clear cookies client-side to be safe
        document.cookie = "samsung_auth=; path=/; max-age=0";
        document.cookie = "auth_role=; path=/; max-age=0";
        document.cookie = "auth_user=; path=/; max-age=0";
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Only fallback to localStorage on network error, not on 401
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem("auth_user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage) {
        router.push("/login");
      } else if (user && isLoginPage) {
        router.push("/");
      }
    }
  }, [user, loading, isLoginPage, router]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    router.push("/");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout API error", e);
    }
    setUser(null);
    localStorage.removeItem("auth_user");
    // Clear cookies client side too
    document.cookie = "samsung_auth=; path=/; max-age=0";
    document.cookie = "auth_role=; path=/; max-age=0";
    document.cookie = "auth_user=; path=/; max-age=0";
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const role = user?.role || null;
  const permissions = user ? getRolePermissions(user.role) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isUser,
        role,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
