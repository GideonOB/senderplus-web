import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "./api";

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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not create account.");
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not sign in.");
    }

    if (data.token && data.profile) {
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not send verification code.");
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Code verification failed.");
    }

    if (data.token && data.profile) {
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not change password.");
    }

    return data;
  }, [authState.token]);

  const refreshProfile = useCallback(async () => {
    if (!authState.token) return null;
    const response = await apiFetch("/auth/profile", { method: "GET" }, authState.token);
    if (!response.ok) {
      throw new Error("Could not load profile.");
    }
    const profile = await response.json();
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
