import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { apiFetch } from "../api";
import femaleAvatar from "../assets/avatar2.png";
import maleAvatar from "../assets/avatar1.png";

const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, profile, refreshProfile, sendCode, changePassword } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "male",
    phone_number: "",
    street: "",
    city: "",
    region: "Greater Accra",
    ghana_post_gps: "",
  });
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    code: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(location.state?.passwordChanged ? "Password changed successfully." : "");
  const [passwordError, setPasswordError] = useState("");

  const hydrateForm = (data) => {
    setForm({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      gender: data.gender || "male",
      phone_number: data.phone_number || "",
      street: data.street || "",
      city: data.city || "",
      region: data.region || "Greater Accra",
      ghana_post_gps: data.ghana_post_gps || "",
    });
    setPicturePreview(data.profile_picture || "");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await refreshProfile();
        if (data) hydrateForm(data);
      } catch {
        // keep fallback from cached profile
      }
    };

    load();
  }, [refreshProfile]);

  const displayName = `${form.first_name} ${form.last_name}`.trim() || "Customer";
  const localPicturePreview = useMemo(() => (pictureFile ? URL.createObjectURL(pictureFile) : ""), [pictureFile]);
  const addressText = useMemo(() => {
    const bits = [form.street, form.city, form.region].filter(Boolean);
    return bits.length ? bits.join(", ") : "Address not set";
  }, [form.street, form.city, form.region]);
  const fallbackAvatar = form.gender === "female" ? femaleAvatar : maleAvatar;
  const profileImageSrc = localPicturePreview || picturePreview || fallbackAvatar;

  useEffect(
    () => () => {
      if (localPicturePreview) URL.revokeObjectURL(localPicturePreview);
    },
    [localPicturePreview]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("address", `${form.street}, ${form.city}, ${form.region}`);

      const res = await apiFetch(
        "/auth/profile",
        {
          method: "PATCH",
          body: payload,
        },
        token
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update profile.");
      }

      const updatedProfile = await refreshProfile();
      if (updatedProfile) hydrateForm(updatedProfile);
      setIsEditingProfile(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitProfilePhoto = async () => {
    if (!pictureFile) {
      setError("Please choose a photo first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = new FormData();
      payload.append("profile_picture", pictureFile);

      const res = await apiFetch(
        "/auth/profile",
        {
          method: "PATCH",
          body: payload,
        },
        token
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update profile photo.");
      }

      setPictureFile(null);
      const updatedProfile = await refreshProfile();
      if (updatedProfile) hydrateForm(updatedProfile);
      setIsEditingPhoto(false);
      setMessage("Profile photo updated successfully.");
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const onCancelProfileEdit = () => {
    if (profile) hydrateForm(profile);
    setError("");
    setIsEditingProfile(false);
  };

  const onCancelPhotoEdit = () => {
    setPictureFile(null);
    setPicturePreview(profile?.profile_picture || "");
    setError("");
    setIsEditingPhoto(false);
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

      <div className="auth-card w-full max-w-4xl p-7 md:p-9">
        <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/60 bg-white/45 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <img src={profileImageSrc} alt={`${displayName} profile`} className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm" />
              {!isEditingPhoto ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPhoto(true);
                    setMessage("");
                    setError("");
                  }}
                  className="text-xs font-semibold text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                >
                  Edit Profile Photo
                </button>
              ) : (
                <div className="w-full max-w-52 space-y-2">
                  <input
                    id="profile_picture"
                    className="auth-input text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-sky-100 file:px-2 file:py-1 file:text-sky-700"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPictureFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onSubmitProfilePhoto}
                      disabled={saving}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {saving ? "Saving..." : "Save Photo"}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelPhotoEdit}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="auth-kicker">Customer profile</p>
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              <p className="text-sm text-slate-600">{form.gender === "female" ? "Female" : "Male"}</p>
              <p className="mt-1 text-sm text-slate-500">{addressText}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/home")} className="text-sm font-medium text-slate-600 underline underline-offset-4 transition hover:text-slate-900">
            Back home
          </button>
        </div>

        {message && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Personal details</h2>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(true);
                  setMessage("");
                  setError("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">First name</dt>
                <dd className="mt-1 text-base text-slate-800">{form.first_name || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Last name</dt>
                <dd className="mt-1 text-base text-slate-800">{form.last_name || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Gender</dt>
                <dd className="mt-1 text-base text-slate-800">{form.gender === "female" ? "Female" : "Male"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Phone number</dt>
                <dd className="mt-1 text-base text-slate-800">{form.phone_number || "Not set"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Street address</dt>
                <dd className="mt-1 text-base text-slate-800">{form.street || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Town / City</dt>
                <dd className="mt-1 text-base text-slate-800">{form.city || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Region</dt>
                <dd className="mt-1 text-base text-slate-800">{form.region || "Not set"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Digital Address / GhanaPostGPS</dt>
                <dd className="mt-1 text-base text-slate-800">{form.ghana_post_gps || "Not set"}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={onSubmitProfile} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="gender">
                  Gender
                </label>
                <select id="gender" className="auth-input" name="gender" value={form.gender} onChange={onChange} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="phone_number">
                  Phone number
                </label>
                <input id="phone_number" className="auth-input" name="phone_number" value={form.phone_number} onChange={onChange} required />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="street">
                  Street address
                </label>
                <input id="street" className="auth-input" name="street" value={form.street} onChange={onChange} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="city">
                  Town / City
                </label>
                <input id="city" className="auth-input" name="city" value={form.city} onChange={onChange} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="region">
                  Region
                </label>
                <select id="region" className="auth-input" name="region" value={form.region} onChange={onChange} required>
                  {GHANA_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="ghana_post_gps">
                  Digital Address / GhanaPostGPS (optional)
                </label>
                <input id="ghana_post_gps" className="auth-input" name="ghana_post_gps" value={form.ghana_post_gps} onChange={onChange} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={saving} className="auth-button">
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={onCancelProfileEdit}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
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
            <button type="submit" disabled={passwordBusy} className="auth-button">
              {passwordBusy ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
