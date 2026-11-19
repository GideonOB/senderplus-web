import { getSafeNextPath } from "../authRedirect.js";

const PROFILE_FIELDS = ["first_name", "last_name", "gender", "phone_number", "street", "city", "region", "ghana_post_gps"];
const EMPTY = { provider: "supabase", userId: null, token: null, profile: null, isAuthenticated: false, isLoading: false, error: "" };

export function confirmationUrl(origin, next) {
  return `${origin}/auth/callback?next=${encodeURIComponent(getSafeNextPath(next))}`;
}

// Framework-independent session lifecycle so mobile can use the same API contract
// with its own secure session storage. Only this web adapter uses the browser SDK.
export function createSupabaseSession({ client, loadProfile, origin }) {
  let state = { ...EMPTY, isLoading: true };
  let generation = 0;
  let pending = null;
  let active = false;
  const listeners = new Set();
  const publish = (next) => { state = next; listeners.forEach((listener) => listener()); };

  async function sync(session) {
    if (!active) return null;
    if (!session) {
      generation += 1;
      pending = null;
      publish({ ...EMPTY });
      return null;
    }
    if (pending?.token === session.access_token) return pending.promise;
    const version = ++generation;
    const sameUser = state.isAuthenticated && state.userId === session.user.id;
    publish(sameUser ? { ...state, token: session.access_token } : { ...EMPTY, token: session.access_token, isLoading: true });
    const promise = (async () => {
      try {
        const profile = await loadProfile(session.access_token);
        if (!active || version !== generation) return null;
        publish({ ...EMPTY, userId: session.user.id, token: session.access_token, profile, isAuthenticated: true });
        return profile;
      } catch (error) {
        if (active && version === generation) {
          publish({ ...EMPTY, token: session.access_token, error: error.message || "Could not complete sign-in. Please try again." });
        }
        throw error;
      } finally {
        if (version === generation) pending = null;
      }
    })();
    pending = { token: session.access_token, promise };
    return promise;
  }

  const resultOrThrow = (result) => {
    if (result.error) throw result.error;
    return result.data;
  };

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    start() {
      active = true;
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        // Do not await SDK calls inside its auth-event callback (SDK holds a lock).
        void sync(session).catch(() => {});
      });
      const version = generation;
      void client.auth.getSession().then((result) => {
        if (active && version === generation) return sync(resultOrThrow(result).session);
      }).catch((error) => {
        if (active && version === generation) publish({ ...EMPTY, error: error.message });
      });
      return () => { active = false; generation += 1; pending = null; subscription.unsubscribe(); };
    },
    async signup(payload, next) {
      const metadata = Object.fromEntries(PROFILE_FIELDS.map((key) => [key, payload[key] || ""]));
      const data = resultOrThrow(await client.auth.signUp({
        email: payload.email.trim(), password: payload.password,
        options: { data: metadata, emailRedirectTo: confirmationUrl(origin, next) },
      }));
      if (data.session) await sync(data.session);
      return { requires_confirmation: !data.session };
    },
    async signin({ username, email, password }) {
      const data = resultOrThrow(await client.auth.signInWithPassword({ email: (email || username).trim(), password }));
      if (!await sync(data.session)) throw new Error("Sign-in was interrupted. Please try again.");
      return { requires_otp: false };
    },
    async sendCode({ email, purpose, next }) {
      if (purpose === "password_change") return resultOrThrow(await client.auth.reauthenticate());
      return resultOrThrow(await client.auth.resend({
        type: "signup", email, options: { emailRedirectTo: confirmationUrl(origin, next) },
      }));
    },
    async changePassword({ current_password, new_password, code }) {
      return resultOrThrow(await client.auth.updateUser({
        current_password, password: new_password, nonce: code,
      }));
    },
    async refreshProfile() {
      const data = resultOrThrow(await client.auth.getSession());
      return sync(data.session);
    },
    async logout() {
      resultOrThrow(await client.auth.signOut({ scope: "local" }));
      await sync(null);
    },
  };
}
