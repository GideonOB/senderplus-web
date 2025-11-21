// src/pages/TrackPage.jsx
import React, { useState } from "react";

const API_BASE_URL = "http://localhost:8000"; // backend URL

const TrackPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false); // NEW: for demo status update

  // Fetch package by tracking ID
  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setPkg(null);

    if (!trackingId.trim()) {
      setError("Please enter a tracking ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/track/${trackingId.trim()}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No package found with that tracking ID.");
        }
        throw new Error("Failed to fetch package. Please try again.");
      }
      const data = await res.json();
      setPkg(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // DEMO: Advance status through lifecycle
  const handleAdvanceStatus = async () => {
    if (!pkg) return;
    setError("");
    setAdvancing(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/advance-status/${pkg.tracking_id}`,
        { method: "POST" }
      );
      if (!res.ok) {
        throw new Error("Failed to advance status.");
      }
      const updated = await res.json();
      setPkg(updated);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while advancing status.");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#73C2FB]">
            Track a Package
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter the tracking ID shared by the sender.
          </p>
        </div>

        {/* Track form */}
        <form onSubmit={handleTrack} className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-gray-700 text-xs uppercase tracking-wide">
              Tracking ID
            </label>
            <input
              className="input"
              placeholder="e.g. dbd92eb6"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold px-6 py-2 rounded-lg shadow-sm transition ${loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Checking..." : "Track Package"}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Package info */}
        {pkg && (
          <div className="mt-4 space-y-4">
            {/* Status card */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Status
              </p>
              <p className="text-lg font-semibold text-[#7E191B]">
                {pkg.status}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tracking ID:{" "}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {pkg.tracking_id}
                </span>
              </p>
            </div>

            {/* DEMO: Advance status button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdvanceStatus}
                disabled={advancing}
                className={`text-xs md:text-sm px-4 py-2 rounded-lg border border-[#73C2FB] text-[#73C2FB] hover:bg-[#73C2FB] hover:text-white transition ${advancing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
                {advancing ? "Updating..." : "Advance Status (demo)"}
              </button>
            </div>

            {/* Sender & recipient */}
            <div className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Sender
                </p>
                <p className="font-medium">{pkg.sender_name}</p>
                <p className="text-sm text-gray-600">{pkg.sender_phone}</p>
                <p className="text-xs text-gray-500">{pkg.sender_address}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Recipient
                </p>
                <p className="font-medium">{pkg.recipient_name}</p>
                <p className="text-sm text-gray-600">{pkg.recipient_phone}</p>
                <p className="text-xs text-gray-500">
                  {pkg.recipient_address}
                </p>
              </div>
            </div>

            {/* Package details */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Package
              </p>
              <p className="font-medium">
                {pkg.package_name}{" "}
                <span className="text-xs text-gray-500">
                  ({pkg.package_type})
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Weight: {pkg.weight} kg
                {pkg.value && (
                  <>
                    {" • "}Estimated value: GH₵ {pkg.value}
                  </>
                )}
              </p>
              {pkg.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {pkg.description}
                </p>
              )}
            </div>

            {/* Photo, if any */}
            {pkg.photo_url && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Package Photo
                </p>
                <img
                  src={`${API_BASE_URL}${pkg.photo_url}`}
                  alt="Package"
                  className="w-full max-h-64 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
