import { useEffect, useState, useSyncExternalStore } from "react";
import { API_BASE_URL } from "../api";
import { AuthContext } from "./context";
import { getSupabaseClient } from "./supabaseClient";
import { createSupabaseSession } from "./supabaseSession";

async function loadProfile(token) {
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Could not load your account. Please try again.");
  return data.profile;
}

export function SupabaseAuthProvider({ children }) {
  const [controller] = useState(() => createSupabaseSession({
    client: getSupabaseClient(), loadProfile, origin: window.location.origin,
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => controller.start(), [controller]);
  return <AuthContext.Provider value={{ ...controller, ...state }}>{children}</AuthContext.Provider>;
}
