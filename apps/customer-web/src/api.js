import { AUTH_PROVIDER } from "./auth/config";
import { getSupabaseClient } from "./auth/supabaseClient";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable.");
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export const apiFetch = async (path, options = {}, token = null) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    if (AUTH_PROVIDER === "supabase") {
      // Ask the SDK for a current session; component state can hold an older token.
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error("Please sign in again.");
      headers.Authorization = `Bearer ${data.session.access_token}`;
    } else {
      headers.Authorization = `Token ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  return response;
};
