import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { API_BASE_URL, apiFetch } from "./api";

const AUTH_STORAGE_KEY = "senderplus-auth";
const DEVICE_STORAGE_KEY = "senderplus-device-id";

const AuthContext = createContext({
  token: null,
  profile: null,
  isAuthenticated: false,
  isDemoMode: false,
  signup: async () => {},
  signin: async () => {},
  sendCode: async () => {},
  verifyCode: async () => {},
  changePassword: async () => {},
  logout: () => {},
  setDemoMode: () => {},
  refreshProfile: async () => {},
});

const generateDeviceId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;
  const next = generateDeviceId();
  localStorage.setItem(DEVICE_STORAGE_KEY, next);
  return next;
};

const getInitialAuthState = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, profile: null, isDemoMode: false };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      profile: parsed.profile || null,
      isDemoMode: Boolean(parsed.isDemoMode),
    };
  } catch {
    return { token: null, profile: null, isDemoMode: false };
  }
};

const parseResponseBody = async (response) => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { raw, isNonJson: true };
  }
};

const extractErrorMessage = (data) => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.find((item) => typeof item === "string") || "";

  const candidates = Object.entries(data).filter(([key]) => !["detail", "raw", "isNonJson"].includes(key));
  for (const [, value] of candidates) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string");
      if (first) return first;
    }
  }

  return "";
};

const getResponseErrorMessage = (response, data, fallbackMessage) => {
  if (data?.detail) return data.detail;
  const extracted = extractErrorMessage(data);
  if (extracted) return extracted;

  if (data?.isNonJson) {
    const isHtmlLike = /^\s*</.test(data.raw);
    if (isHtmlLike) {
      if (response.status === 400) {
        return `Backend returned an HTML 400 page instead of JSON. This usually means Django blocked the request before it reached the API (check ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, and CSRF_TRUSTED_ORIGINS for ${API_BASE_URL}).`;
      }
      if (response.status === 403) {
        return `Backend returned an HTML 403 page instead of JSON. Check CSRF_TRUSTED_ORIGINS and CORS_ALLOWED_ORIGINS for ${API_BASE_URL}.`;
      }
      return `Server returned HTML instead of JSON from ${API_BASE_URL}. Check your VITE_API_BASE_URL and backend route configuration.`;
    }
    return "Server returned a non-JSON response.";
  }

  if (response.status >= 500) return "Server error. Please try again shortly.";
  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialAuthState);

  const persist = useCallback((next) => {
    setAuthState(next);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signup = useCallback(async (payload) => {
    const response = await apiFetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, data, "Could not create account."));
    }

    return data;
  }, []);

  const signin = useCallback(async (payload) => {
    const deviceId = getDeviceId();
    const response = await apiFetch("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, device_id: deviceId }),
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, data, "Could not sign in."));
    }

    if (data?.token && data?.profile) {
      persist({ token: data.token, profile: data.profile, isDemoMode: false });
    }

    return data;
  }, [persist]);

  const sendCode = useCallback(async ({ email, purpose }) => {
    const response = await apiFetch(
      "/auth/send-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      },
      authState.token
    );

    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, data, "Could not send verification code."));
    }

    return data;
  }, [authState.token]);

  const verifyCode = useCallback(async ({ email, code, purpose, challenge_token }) => {
    const deviceId = getDeviceId();
    const response = await apiFetch("/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose, challenge_token, device_id: deviceId }),
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, data, "Code verification failed."));
    }

    if (data?.token && data?.profile) {
      persist({ token: data.token, profile: data.profile, isDemoMode: false });
    }

    return data;
  }, [persist]);

  const changePassword = useCallback(async ({ current_password, new_password, code }) => {
    const response = await apiFetch(
      "/auth/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password, new_password, code }),
      },
      authState.token
    );

    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, data, "Could not change password."));
    }

    return data;
  }, [authState.token]);

  const refreshProfile = useCallback(async () => {
    if (!authState.token) return null;
    const response = await apiFetch("/auth/profile", { method: "GET" }, authState.token);
    const profile = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(getResponseErrorMessage(response, profile, "Could not load profile."));
    }
    persist({ ...authState, profile });
    return profile;
  }, [authState, persist]);

  const setDemoMode = useCallback((isDemoMode) => {
    persist({ ...authState, isDemoMode });
  }, [authState, persist]);

  const logout = useCallback(() => {
    persist({ token: null, profile: null, isDemoMode: false });
  }, [persist]);

  const value = useMemo(
    () => ({
      token: authState.token,
      profile: authState.profile,
      isAuthenticated: Boolean(authState.token),
      isDemoMode: authState.isDemoMode,
      signup,
      signin,
      sendCode,
      verifyCode,
      changePassword,
      logout,
      setDemoMode,
      refreshProfile,
    }),
    [authState, signup, signin, sendCode, verifyCode, changePassword, logout, setDemoMode, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
