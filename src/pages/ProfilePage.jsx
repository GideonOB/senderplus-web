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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#73C2FB]">My Profile</h1>
            <button type="button" onClick={() => navigate("/home")} className="text-sm underline">Back home</button>
          </div>

          {message && <div className="mb-3 rounded bg-green-100 text-green-700 px-3 py-2 text-sm">{message}</div>}
          {error && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" name="first_name" value={form.first_name} onChange={onChange} required />
            <input className="input" name="last_name" value={form.last_name} onChange={onChange} required />
            <input className="input md:col-span-2" name="phone_number" value={form.phone_number} onChange={onChange} required />
            <input className="input md:col-span-2" name="address" value={form.address} onChange={onChange} required />
            <button type="submit" disabled={saving} className="md:col-span-2 bg-[#73C2FB] text-white font-semibold py-2.5 rounded-lg">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-[#73C2FB] mb-2">Change password</h2>
          <p className="text-sm text-gray-600 mb-4">Request a one-time code before changing your password.</p>

          {passwordMessage && <div className="mb-3 rounded bg-green-100 text-green-700 px-3 py-2 text-sm">{passwordMessage}</div>}
          {passwordError && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{passwordError}</div>}

          <div className="mb-4">
            <button
              type="button"
              onClick={onSendPasswordCode}
              disabled={passwordBusy}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg"
            >
              Send verification code
            </button>
          </div>

          <form onSubmit={onPasswordSubmit} className="grid grid-cols-1 gap-4">
            <input
              className="input"
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={onPasswordFieldChange}
              placeholder="Current password"
              required
            />
            <input
              className="input"
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={onPasswordFieldChange}
              placeholder="New password (min 8 chars)"
              required
            />
            <input
              className="input"
              type="text"
              name="code"
              value={passwordForm.code}
              onChange={onPasswordFieldChange}
              placeholder="6-digit verification code"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={passwordBusy}
              className="bg-[#73C2FB] text-white font-semibold py-2.5 rounded-lg"
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
