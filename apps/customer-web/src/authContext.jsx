import { useContext } from "react";
import { AuthContext } from "./auth/context";
import { AUTH_PROVIDER } from "./auth/config";
import { LegacyAuthProvider } from "./auth/LegacyAuthProvider";
import { SupabaseAuthProvider } from "./auth/SupabaseAuthProvider";

export const AuthProvider = AUTH_PROVIDER === "supabase" ? SupabaseAuthProvider : LegacyAuthProvider;
export const useAuth = () => useContext(AuthContext);
