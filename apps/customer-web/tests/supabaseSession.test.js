import { test } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseSession, confirmationUrl } from "../src/auth/supabaseSession.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const session = (token = "access-1", id = "customer-1") => ({ access_token: token, user: { id } });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function harness({ restored = null, loadProfile = async () => ({ first_name: "Ama", roles: ["customer"] }) } = {}) {
  let callback;
  let current = restored;
  const calls = [];
  const client = { auth: {
    onAuthStateChange(fn) { callback = fn; return { data: { subscription: { unsubscribe() { callback = null; } } } }; },
    async getSession() { return { data: { session: current }, error: null }; },
    async signInWithPassword(payload) {
      calls.push(["signin", payload]); current = session(); callback("SIGNED_IN", current);
      return { data: { session: current }, error: null };
    },
    async signUp(payload) { calls.push(["signup", payload]); return { data: { session: null }, error: null }; },
    async resend(payload) { calls.push(["resend", payload]); return { data: {}, error: null }; },
    async reauthenticate() { calls.push(["reauthenticate"]); return { data: {}, error: null }; },
    async updateUser(payload) { calls.push(["update", payload]); return { data: {}, error: null }; },
    async signOut(payload) { calls.push(["signout", payload]); current = null; callback("SIGNED_OUT", null); return { error: null }; },
  } };
  const controller = createSupabaseSession({ client, loadProfile, origin: "https://senderplus.example" });
  const emit = (event, next) => { current = next; callback?.(event, next); };
  return { client, calls, controller, emit };
}

test("restored auth waits for Django profile and permissions", async () => {
  const gate = deferred();
  const { controller } = harness({ restored: session(), loadProfile: () => gate.promise });
  const stop = controller.start();
  await tick();
  assert.equal(controller.getSnapshot().isLoading, true);
  assert.equal(controller.getSnapshot().isAuthenticated, false);
  gate.resolve({ roles: ["customer"] });
  await tick();
  assert.equal(controller.getSnapshot().isAuthenticated, true);
  assert.deepEqual(controller.getSnapshot().profile.roles, ["customer"]);
  stop();
});

test("signup only sends profile fields as metadata and waits for email confirmation", async () => {
  const { controller, calls } = harness(); controller.start(); await tick();
  const result = await controller.signup({ email: " ama@example.com ", password: "password-secret", first_name: "Ama", roles: ["admin"], is_staff: true }, "/track?ref=42");
  const payload = calls[0][1];
  assert.equal(payload.email, "ama@example.com");
  assert.equal(payload.password, "password-secret");
  assert.equal(payload.options.data.first_name, "Ama");
  for (const key of ["password", "roles", "is_staff"]) assert.equal(key in payload.options.data, false);
  assert.equal(payload.options.emailRedirectTo, "https://senderplus.example/auth/callback?next=%2Ftrack%3Fref%3D42");
  assert.equal(result.requires_confirmation, true);
  assert.equal(controller.getSnapshot().isAuthenticated, false);
});

test("confirmation URL cannot redirect to an external destination", () => {
  assert.equal(confirmationUrl("https://senderplus.example", "https://evil.example"), "https://senderplus.example/auth/callback?next=%2Fhome");
});

test("sign-in resolves only after the API accepts the identity", async () => {
  const gate = deferred();
  const { controller } = harness({ loadProfile: () => gate.promise }); controller.start(); await tick();
  let finished = false;
  const login = controller.signin({ username: "ama@example.com", password: "secret" }).then(() => { finished = true; });
  await tick(); assert.equal(finished, false);
  gate.resolve({ roles: ["customer"] }); await login;
  assert.equal(controller.getSnapshot().isAuthenticated, true);
});

test("an API failure is visible and retry completes without another password login", async () => {
  let fail = true;
  const { controller } = harness({ restored: session(), loadProfile: async () => {
    if (fail) throw new Error("Temporarily unavailable");
    return { roles: ["customer"] };
  } });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().isLoading, false);
  assert.equal(controller.getSnapshot().isAuthenticated, false);
  assert.equal(controller.getSnapshot().error, "Temporarily unavailable");
  fail = false;
  await controller.refreshProfile();
  assert.equal(controller.getSnapshot().isAuthenticated, true);
  assert.equal(controller.getSnapshot().error, "");
});

test("sign-out cannot be undone by a late profile response", async () => {
  const gate = deferred();
  const { controller } = harness({ restored: session(), loadProfile: () => gate.promise });
  controller.start(); await tick();
  await controller.logout(); gate.resolve({ roles: ["customer"] }); await tick();
  assert.equal(controller.getSnapshot().isAuthenticated, false);
  assert.equal(controller.getSnapshot().profile, null);
  assert.equal(controller.getSnapshot().token, null);
});

test("refresh replaces the token without unmounting authenticated pages", async () => {
  const seen = [];
  const { controller, emit } = harness({ restored: session() }); controller.start(); await tick();
  const off = controller.subscribe(() => seen.push(controller.getSnapshot()));
  emit("TOKEN_REFRESHED", session("access-2")); await tick();
  await controller.refreshProfile();
  assert.equal(controller.getSnapshot().token, "access-2");
  assert.ok(seen.every((state) => state.isAuthenticated && !state.isLoading));
  off();
});

test("a different user never sees a previous user's profile while loading", async () => {
  const second = deferred();
  const { controller, emit } = harness({ restored: session(), loadProfile: async (token) => token === "access-1" ? { first_name: "Ama" } : second.promise });
  controller.start(); await tick();
  emit("SIGNED_IN", session("access-2", "customer-2"));
  assert.equal(controller.getSnapshot().profile, null);
  assert.equal(controller.getSnapshot().isAuthenticated, false);
  second.resolve({ first_name: "Kofi" }); await tick();
  assert.equal(controller.getSnapshot().profile.first_name, "Kofi");
});

test("a stale token's response cannot overwrite a newer session", async () => {
  const old = deferred();
  const { controller, emit } = harness({ restored: session(), loadProfile: async (token) => token === "access-1" ? old.promise : { first_name: "Current" } });
  controller.start(); await tick(); emit("TOKEN_REFRESHED", session("access-2")); await tick();
  old.resolve({ first_name: "Stale" }); await tick();
  assert.equal(controller.getSnapshot().profile.first_name, "Current");
  assert.equal(controller.getSnapshot().token, "access-2");
});

test("password changes send the current password and email nonce to Supabase", async () => {
  const { controller, calls } = harness({ restored: session() }); controller.start(); await tick();
  await controller.sendCode({ purpose: "password_change" });
  await controller.changePassword({ current_password: "old", new_password: "new", code: "123456" });
  assert.deepEqual(calls, [["reauthenticate"], ["update", { current_password: "old", password: "new", nonce: "123456" }]]);
});

test("signout errors do not falsely report a successful logout", async () => {
  const { controller, client } = harness({ restored: session() }); controller.start(); await tick();
  client.auth.signOut = async () => ({ error: new Error("offline") });
  await assert.rejects(controller.logout(), /offline/);
  assert.equal(controller.getSnapshot().isAuthenticated, true);
});

test("unmount and remount discard stale work and restore the session", async () => {
  const first = deferred(); let calls = 0;
  const { controller } = harness({ restored: session(), loadProfile: async () => ++calls === 1 ? first.promise : { first_name: "Current" } });
  const stop = controller.start(); await tick(); stop(); controller.start(); await tick();
  first.resolve({ first_name: "Stale" }); await tick();
  assert.equal(controller.getSnapshot().profile.first_name, "Current");
});
