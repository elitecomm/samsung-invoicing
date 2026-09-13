"use client";

import { offlineStore } from "./offlineStore";

// Detect if we're in offline mode
export function isOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check env variable
  if (process.env.NEXT_PUBLIC_OFFLINE_MODE === "true") return true;
  
  // Check localStorage flag
  const flag = localStorage.getItem("offline_mode");
  if (flag === "true") return true;
  
  // Check if DATABASE_URL is dummy or missing (for preview)
  // In offline version, we always enable offline mode
  const offlineVersion = localStorage.getItem("is_offline_version");
  if (offlineVersion === "true") return true;
  
  return false;
}

export function enableOfflineVersion() {
  if (typeof window === "undefined") return;
  localStorage.setItem("is_offline_version", "true");
  localStorage.setItem("offline_mode", "true");
  offlineStore.enableOfflineMode();
}

export function useOfflineMode() {
  if (typeof window === "undefined") return false;
  return isOfflineMode() || true; // For offline build, always true
}
