// src/pages/SubmitPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://senderplus-django-api.onrender.com"; // backend URL

// Helper: format phone as (000) 000-0000 and strip non-digits
const formatPhoneNumber = (value) => {
  let digits = value.replace(/\D/g, "").slice(0, 10); // keep max 10 digits
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-2"
          >
            <img
              src="/senderplus-logo.png"
              alt="Sender+ logo"
              className="h-8 w-auto"
            />
          </button>
          <nav className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={goHome}
              className="hover:text-[#73C2FB]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={goTrack}
              className="hover:text-[#73C2FB]"
            >
              Track
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 md:p-8">
          {/* Header + Logo */}
          <div className="text-center mb-6">
            <img
              src="/senderplus-logo.png"
              alt="Sender+ logo"
              className="w-56 mx-auto mb-4"
            />
            <h2 className="text-2xl md:text-3xl font-bold text-[#73C2FB]">
              Send a Package
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Bridging Ghana One Package at a Time.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="space-y-6 text-sm md:text-base"
          >
            {/* Sender Info */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-[#7E191B] font-semibold px-1">
                Sender Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Sender Name
                  </label>
                  <input
                    name="senderName"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    className="input"
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={14} // (000) 000-0000
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Please enter a 10-digit phone number."
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    name="senderEmail"
                    type="email"
                    value={formData.senderEmail}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Address
                  </label>
                  <input
                    name="senderAddress"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Recipient Info */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-[#7E191B] font-semibold px-1">
                Recipient Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Recipient Name
                  </label>
                  <input
                    name="recipientName"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleChange}
                    className="input"
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={14}
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Please enter a 10-digit phone number."
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Email (optional)
                  </label>
                  <input
                    name="recipientEmail"
                    type="email"
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Address / Campus / Hall
                  </label>
                  <input
                    name="recipientAddress"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Package Info */}
            <fieldset className="border border-gray-200 rounded-lg p-4">
              <legend className="text-[#7E191B] font-semibold px-1">
                Package Details
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Package Name
                  </label>
                  <input
                    name="packageName"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Type (Box, Envelope, Document…)
                  </label>
                  <input
                    name="type"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Estimated Weight (kg)
                  </label>
                  <input
                    name="weight"
                    type="number"
                    step="0.01"
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Estimated Value (optional)
                  </label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                    Package Photo (optional)
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You can upload a photo so the recipient recognizes the
                    package more easily.
                  </p>
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold px-6 py-2 rounded-lg shadow-sm transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
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
