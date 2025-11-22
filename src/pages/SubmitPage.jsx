import React, { useState } from "react";

const API_BASE_URL = "https://senderplus-api.onrender.com";

const SubmitPage = () => {
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
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setTrackingId("");
    setLoading(true);

    try {
      const data = new FormData();

      // Map frontend field names to backend field names
      data.append("sender_name", formData.senderName);
      data.append("sender_phone", formData.senderPhone);
      if (formData.senderEmail) data.append("sender_email", formData.senderEmail);
      data.append("sender_address", formData.senderAddress);

      data.append("recipient_name", formData.recipientName);
      data.append("recipient_phone", formData.recipientPhone);
      if (formData.recipientEmail)
        data.append("recipient_email", formData.recipientEmail);
      data.append("recipient_address", formData.recipientAddress);

      data.append("package_name", formData.packageName);
      data.append("package_type", formData.type);
      data.append("weight", formData.weight || "0");
      if (formData.value) data.append("value", formData.value);
      if (formData.description)
        data.append("description", formData.description);

      if (formData.photo) {
        data.append("photo", formData.photo);
      }

      const response = await fetch(`${API_BASE_URL}/submit-package`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Failed to submit package. Please try again.");
      }

      const json = await response.json();
      setTrackingId(json.tracking_id);
      setSuccessMsg("Package submitted successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 md:p-8">
        {/* Header + Logo */}
        <div className="text-center mb-6">
          <img
            src="/senderplus-logo.png"
            alt="SenderPlus Logo"
            className="w-56 mx-auto mb-4"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-[#73C2FB]">
            Send a Package
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Bridging Ghana One Package at a Time
          </p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-4 rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded bg-green-100 text-green-700 px-4 py-2 text-sm">
            {successMsg}
            {trackingId && (
              <div className="mt-1">
                Tracking ID:{" "}
                <span className="font-mono font-semibold">{trackingId}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm md:text-base">
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
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
                  Email (optional)
                </label>
                <input
                  name="senderEmail"
                  type="email"
                  onChange={handleChange}
                  className="input"
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
                  onChange={handleChange}
                  className="input"
                  required
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
    </div>
  );
};

export default SubmitPage;
