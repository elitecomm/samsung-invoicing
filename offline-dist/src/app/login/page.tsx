"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Shield, User, Lock, LogIn, Eye, EyeOff, Smartphone } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "user") => {
    setSelectedRole(role);
    if (role === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("user");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Smartphone className="text-blue-900" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Samsung Service</h1>
              <p className="text-sm text-blue-200">Invoicing System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Professional Service Center Management
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Streamline your invoicing, manage customers, and track your business growth with our comprehensive platform.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="text-white" size={16} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Role-Based Access</h3>
                <p className="text-blue-200 text-sm">Secure admin and user modes with tailored permissions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="text-white" size={16} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Efficient Workflow</h3>
                <p className="text-blue-200 text-sm">Create invoices, manage customers, generate reports instantly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-300 text-sm">Elite Communication • Varanasi</p>
          <p className="text-blue-400 text-xs mt-1">© 2025 Samsung Service Center</p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Samsung Service</h1>
              <p className="text-sm text-gray-600">Invoicing System</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === "admin"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={18} className={selectedRole === "admin" ? "text-blue-600" : "text-gray-500"} />
                  <span className={`font-semibold ${selectedRole === "admin" ? "text-blue-900" : "text-gray-700"}`}>Admin</span>
                </div>
                <p className="text-xs text-gray-500">Full access to all features</p>
                {selectedRole === "admin" && <div className="mt-2 text-xs font-medium text-blue-600">✓ Selected</div>}
              </button>

              <button
                type="button"
                onClick={() => fillDemo("user")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === "user"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User size={18} className={selectedRole === "user" ? "text-green-600" : "text-gray-500"} />
                  <span className={`font-semibold ${selectedRole === "user" ? "text-green-900" : "text-gray-700"}`}>User</span>
                </div>
                <p className="text-xs text-gray-500">Create, view & dashboard only</p>
                {selectedRole === "user" && <div className="mt-2 text-xs font-medium text-green-600">✓ Selected</div>}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Demo Credentials</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <Shield size={12} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">Admin</span>
                  </div>
                  <code className="text-xs bg-white px-2.5 py-1 rounded-lg border font-mono">
                    admin / admin123
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <User size={12} className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">User</span>
                  </div>
                  <code className="text-xs bg-white px-2.5 py-1 rounded-lg border font-mono">
                    user / user123
                  </code>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Click the cards above to auto-fill credentials</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Secure login • Role-based access control • Samsung Service Center
          </p>
        </div>
      </div>
    </div>
  );
}
