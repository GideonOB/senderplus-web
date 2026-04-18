import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { apiFetch } from "../api";

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, profile, refreshProfile, sendCode, changePassword } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    code: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (location.state?.passwordChanged) {
      setPasswordMessage("Password changed successfully.");
    }
  }, [location.state]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await refreshProfile();
        if (data) {
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone_number: data.phone_number || "",
            address: data.address || "",
          });
        }
      } catch {
        // keep fallback from cached profile
      }
    };

    load();
  }, [refreshProfile]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone_number: profile.phone_number || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await apiFetch(
        "/auth/profile",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        token
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update profile.");
      }

      await refreshProfile();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const onPasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSendPasswordCode = async () => {
    setPasswordBusy(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      await sendCode({ purpose: "password_change" });
      setPasswordMessage("Password change code sent. Check backend logs/email.");
    } catch (err) {
      setPasswordError(err.message || "Failed to send code.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      await changePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "", code: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setPasswordError(err.message || "Password update failed.");
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />

      <div className="auth-card w-full max-w-3xl p-7 md:p-9">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="auth-kicker">Account settings</p>
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            </div>
            <button type="button" onClick={() => navigate("/home")} className="text-sm font-medium text-slate-600 underline underline-offset-4 transition hover:text-slate-900">
              Back home
            </button>
          </div>

          {message && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="first_name">
                First name
              </label>
              <input id="first_name" className="auth-input" name="first_name" value={form.first_name} onChange={onChange} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="last_name">
                Last name
              </label>
              <input id="last_name" className="auth-input" name="last_name" value={form.last_name} onChange={onChange} required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="phone_number">
                Phone number
              </label>
              <input id="phone_number" className="auth-input" name="phone_number" value={form.phone_number} onChange={onChange} required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="address">
                Address
              </label>
              <input id="address" className="auth-input" name="address" value={form.address} onChange={onChange} required />
            </div>
            <button type="submit" disabled={saving} className="auth-button md:col-span-2">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-slate-200/80 pt-6">
          <h2 className="text-xl font-semibold text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-600">Request a one-time code before changing your password.</p>

          {passwordMessage && <div className="mb-3 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</div>}
          {passwordError && <div className="mb-3 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{passwordError}</div>}

          <div className="mb-4">
            <button
              type="button"
              onClick={onSendPasswordCode}
              disabled={passwordBusy}
              className="rounded-xl border border-slate-200 bg-white/75 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
            >
              Send verification code
            </button>
          </div>

          <form onSubmit={onPasswordSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="current_password">
                Current password
              </label>
              <input
                id="current_password"
                className="auth-input"
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={onPasswordFieldChange}
                placeholder="Current password"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="new_password">
                New password
              </label>
              <input
                id="new_password"
                className="auth-input"
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={onPasswordFieldChange}
                placeholder="New password (min 8 chars)"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="password_code">
                Verification code
              </label>
              <input
                id="password_code"
                className="auth-input"
                type="text"
                name="code"
                value={passwordForm.code}
                onChange={onPasswordFieldChange}
                placeholder="6-digit verification code"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordBusy}
              className="auth-button"
            >
              {passwordBusy ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
