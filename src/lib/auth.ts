export type Role = "admin" | "user";

export interface AuthUser {
  username: string;
  role: Role;
}

export interface UserCredentials {
  username: string;
  password: string;
  role: Role;
}

// Default users - in production these should be in DB/env
// For demo: admin/admin123 and user/user123 also allow admin/admin and user/user
export const DEFAULT_USERS: Record<string, { password: string; role: Role; displayName: string }> = {
  admin: { password: "admin123", role: "admin", displayName: "Administrator" },
  user: { password: "user123", role: "user", displayName: "Staff User" },
};

export function validateCredentials(username: string, password: string): AuthUser | null {
  const normalizedUser = username.trim().toLowerCase();
  
  // Allow both exact and lowercase matches
  const userEntry = DEFAULT_USERS[normalizedUser] || DEFAULT_USERS[username];
  
  if (!userEntry) return null;

  // Accept both admin123 and admin as password for convenience, same for user
  const validPasswords = [
    userEntry.password,
    normalizedUser, // e.g., admin/admin
    `${normalizedUser}123`, // just in case
  ];

  // Also allow: admin -> admin123, user -> user123 already covered
  // And also allow password === username for quick demo
  if (password === userEntry.password || password === normalizedUser || validPasswords.includes(password)) {
    // More strict check: actually we want to accept admin123 for admin, user123 for user, and also admin/admin, user/user
    const isValid =
      (normalizedUser === "admin" && (password === "admin123" || password === "admin")) ||
      (normalizedUser === "user" && (password === "user123" || password === "user"));

    if (isValid) {
      return {
        username: normalizedUser,
        role: userEntry.role,
      };
    }
  }

  return null;
}

export function getRolePermissions(role: Role) {
  if (role === "admin") {
    return {
      canViewDashboard: true,
      canCreateInvoice: true,
      canViewInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: true,
      canViewCustomers: true,
      canManageCustomers: true,
      canViewReports: true,
      canViewSettings: true,
      canManageSettings: true,
      canExportData: true,
    };
  } else {
    // user role: only allow create, view and use dashboard
    return {
      canViewDashboard: true,
      canCreateInvoice: true,
      canViewInvoices: true,
      canEditInvoices: false,
      canDeleteInvoices: false,
      canViewCustomers: false,
      canManageCustomers: false,
      canViewReports: false,
      canViewSettings: false,
      canManageSettings: false,
      canExportData: false,
    };
  }
}

export const COOKIE_NAME = "samsung_auth";
