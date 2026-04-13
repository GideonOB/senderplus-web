import React, { createContext, useContext, useMemo, useState } from "react";
import { apiFetch } from "./api";

const AUTH_STORAGE_KEY = "senderplus-auth";

const AuthContext = createContext({
  token: null,
  profile: null,
  isAuthenticated: false,
  isDemoMode: false,
  signup: async () => {},
  signin: async () => {},
  logout: () => {},
  setDemoMode: () => {},
  refreshProfile: async () => {},
});

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

  const persist = (next) => {
    setAuthState(next);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  };

  const signup = async (payload) => {
    const response = await apiFetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not create account.");
    }

    persist({ token: data.token, profile: data.profile, isDemoMode: false });
    return data;
  };

  const signin = async (payload) => {
    const response = await apiFetch("/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Could not sign in.");
    }

    persist({ token: data.token, profile: data.profile, isDemoMode: false });
    return data;
  };

  const refreshProfile = async () => {
    if (!authState.token) return null;
    const response = await apiFetch("/auth/profile", { method: "GET" }, authState.token);
    if (!response.ok) {
      throw new Error("Could not load profile.");
    }
    const profile = await response.json();
    persist({ ...authState, profile });
    return profile;
  };

  const setDemoMode = (isDemoMode) => {
    persist({ ...authState, isDemoMode });
  };

  const logout = () => {
    persist({ token: null, profile: null, isDemoMode: false });
  };

  const value = useMemo(
    () => ({
      token: authState.token,
      profile: authState.profile,
      isAuthenticated: Boolean(authState.token),
      isDemoMode: authState.isDemoMode,
      signup,
      signin,
      logout,
      setDemoMode,
      refreshProfile,
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
