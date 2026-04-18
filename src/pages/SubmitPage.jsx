// src/pages/SubmitPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../api";

// Helper: format phone as (000) 000-0000 and strip non-digits
const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10); // keep max 10 digits
  const length = digits.length;

  if (length === 0) return "";
  if (length < 4) return `(${digits}`;
  if (length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const SubmitPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
    packageName: "",
    type: "",
    weight: "",
    value: "",
    description: "",
    photo: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle all input changes (including file + phone formatting)
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files && files.length > 0 ? files[0] : null,
      }));
      return;
    }

    // Special handling for phone fields
    if (name === "senderPhone" || name === "recipientPhone") {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
      return;
    }

    // All other fields
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new FormData();

      // Sender (email required)
      data.append("sender_name", formData.senderName);
      data.append("sender_phone", formData.senderPhone);
      data.append("sender_email", formData.senderEmail);
      data.append("sender_address", formData.senderAddress);

      // Recipient
      data.append("recipient_name", formData.recipientName);
      data.append("recipient_phone", formData.recipientPhone);
      if (formData.recipientEmail) {
        data.append("recipient_email", formData.recipientEmail);
      }
      data.append("recipient_address", formData.recipientAddress);

      // Package
      data.append("package_name", formData.packageName);
      data.append("package_type", formData.type);
      data.append("weight", formData.weight || "0");
      if (formData.value) {
        data.append("value", formData.value);
      }
      if (formData.description) {
        data.append("description", formData.description);
      }

      // Photo (optional)
      if (formData.photo) {
        data.append("photo", formData.photo);
      }

      const response = await fetch(`${API_BASE_URL}/submit-package`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Submit package failed:", response.status, errorText);
        throw new Error("Failed to submit package. Please try again.");
      }

      const json = await response.json();

      // Redirect to success page with tracking ID and sender name
      navigate("/submit-success", {
        state: {
          trackingId: json.tracking_id,
          senderName: formData.senderName,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => navigate("/home");
  const goTrack = () => navigate("/track");

  return (
    <div className="plush-shell min-h-screen pb-8">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />

      <header className="plush-nav mx-auto mt-4 max-w-6xl px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={goHome} className="flex items-center gap-2">
            <img src="/senderplus-logo.png" alt="Sender+ logo" className="h-8 w-auto" />
          </button>

          <nav className="flex gap-2 text-sm sm:gap-3">
            <button type="button" onClick={goHome} className="plush-nav-link">
              Home
            </button>
            <button type="button" onClick={goTrack} className="plush-nav-link">
              Track
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-5">
        <div className="plush-card p-6 md:p-8">
          <div className="mb-6 text-center md:mb-8">
            <p className="auth-kicker">Send with confidence</p>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Send a Package</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Create a premium delivery request in one flow. We&apos;ll capture sender and recipient details, then issue tracking instantly.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6 text-sm md:text-base">
            <fieldset className="plush-fieldset">
              <legend className="plush-legend">Sender Information</legend>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="plush-label">Sender Name</label>
                  <input name="senderName" onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Phone Number</label>
                  <input
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    className="auth-input"
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={14}
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Please enter a 10-digit phone number."
                  />
                </div>
                <div>
                  <label className="plush-label">Email</label>
                  <input name="senderEmail" type="email" value={formData.senderEmail} onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Address</label>
                  <input name="senderAddress" onChange={handleChange} className="auth-input" required />
                </div>
              </div>
            </fieldset>

            <fieldset className="plush-fieldset">
              <legend className="plush-legend">Recipient Information</legend>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="plush-label">Recipient Name</label>
                  <input name="recipientName" onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Phone Number</label>
                  <input
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleChange}
                    className="auth-input"
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={14}
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Please enter a 10-digit phone number."
                  />
                </div>
                <div>
                  <label className="plush-label">Email (optional)</label>
                  <input name="recipientEmail" type="email" onChange={handleChange} className="auth-input" />
                </div>
                <div>
                  <label className="plush-label">Address / Campus / Hall</label>
                  <input name="recipientAddress" onChange={handleChange} className="auth-input" required />
                </div>
              </div>
            </fieldset>

            <fieldset className="plush-fieldset">
              <legend className="plush-legend">Package Details</legend>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="plush-label">Package Name</label>
                  <input name="packageName" onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Type (Box, Envelope, Document…)</label>
                  <input name="type" onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Estimated Weight (kg)</label>
                  <input name="weight" type="number" step="0.01" onChange={handleChange} className="auth-input" required />
                </div>
                <div>
                  <label className="plush-label">Estimated Value (optional)</label>
                  <input name="value" type="number" step="0.01" onChange={handleChange} className="auth-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="plush-label">Description</label>
                  <textarea name="description" rows={3} onChange={handleChange} className="auth-input" />
                </div>
                <div className="md:col-span-2">
                  <label className="plush-label">Package Photo (optional)</label>
                  <input type="file" name="photo" accept="image/*" onChange={handleChange} className="auth-input" />
                  <p className="mt-1 text-xs text-slate-500">Upload a quick photo so the recipient can recognize the package more easily.</p>
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="auth-button px-6 py-2.5">
                {loading ? "Submitting..." : "Submit Package"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SubmitPage;
