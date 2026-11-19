export const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || "legacy";
if (!["legacy", "supabase"].includes(AUTH_PROVIDER)) {
  throw new Error("VITE_AUTH_PROVIDER must be legacy or supabase.");
}
