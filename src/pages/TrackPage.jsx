// src/pages/TrackPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = "https://senderplus-django-api.onrender.com";

const STATUS_STEPS = [
  "Waiting for package to reach bus station",
  "Package in our van en route to campus",
  "Package at our campus hub",
  "Package delivered to recipient",
];

const TrackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTrackingId = location.state?.trackingId || "";
  const [trackingIdInput, setTrackingIdInput] = useState(initialTrackingId);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialTrackingId) {
      handleFetch(initialTrackingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackingId]);

  const goHome = () => navigate("/home");

  const handleFetch = async (id) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setError("Please enter a tracking ID.");
      setPkg(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/track/${trimmed}`);
      if (!res.ok) {
        if (res.status === 404) {
          setPkg(null);
          setError(
            "We couldn’t find a package with that ID. Please confirm the code from the sender."
          );
        } else {
          const txt = await res.text();
          console.error("Track error:", res.status, txt);
          throw new Error("Failed to fetch package details.");
        }
        return;
      }
      const data = await res.json();
      setPkg(data);
    } catch (err) {
      console.error(err);
      setPkg(null);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFetch(trackingIdInput);
  };

  const handleAdvanceStatus = async () => {
    if (!pkg?.tracking_id) return;
    setAdvancing(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/advance-status/${pkg.tracking_id}`,
        {
          method: "POST",
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        console.error("Advance status error:", res.status, txt);
        throw new Error("Could not advance package status (demo).");
      }
      const data = await res.json();
      setPkg(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update status.");
    } finally {
      setAdvancing(false);
    }
  };

  const statusLabel = pkg?.status_display || pkg?.status || "";

  const currentStatusIndex =
    pkg && STATUS_STEPS.includes(statusLabel)
      ? STATUS_STEPS.indexOf(statusLabel)
      : -1;

  const imageUrl =
    pkg && pkg.photo_url ? `${API_BASE_URL}${pkg.photo_url}` : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Top header */}
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
            <span className="font-semibold text-[#73C2FB]">Track</span>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Search card */}
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#73C2FB] mb-2">
              Track a Package
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              Enter the tracking ID sent to the sender to check where a package
              is in the Sender+ journey.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-3 items-stretch md:items-center"
            >
              <input
                type="text"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                placeholder="e.g., dbd92eb6"
                className="flex-1 input"
              />
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm ${loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#73C2FB] text-white hover:bg-[#61B2EB]"
                  }`}
              >
                <span>🔍</span>
                <span>{loading ? "Checking..." : "Track Package"}</span>
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {pkg && (
            <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 space-y-6">
              {/* Header + status pill + demo text + button */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-gray-500 tracking-wide">
                      Tracking ID
                    </p>
                    <p className="font-mono font-semibold text-sm md:text-base">
                      {pkg.tracking_id}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#73C2FB]/10 text-[#73C2FB]">
                      <span>📍</span>
                      <span>{statusLabel}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Demo mode – you can step this package through each stage of
                    the journey to show how Sender+ tracking will work.
                  </p>
                  <button
                    type="button"
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm ${advancing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#7E191B] text-white hover:bg-[#681117]"
                      }`}
                  >
                    <span>⏭</span>
                    <span>
                      {advancing
                        ? "Updating status..."
                        : "Advance Status (demo)"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status timeline */}
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                  Journey Progress
                </p>
                <ol className="space-y-2">
                  {STATUS_STEPS.map((step, index) => {
                    const reached = index <= currentStatusIndex;
                    return (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div
                          className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${reached
                            ? "border-[#73C2FB] bg-[#73C2FB]"
                            : "border-gray-300 bg-white"
                            }`}
                        >
                          {reached && (
                            <span className="text-[10px] text-white">✓</span>
                          )}
                        </div>
                        <span
                          className={`${reached
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                            }`}
                        >
                          {step}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Sender/Recipient details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    From (Sender)
                  </h3>
                  <p className="text-sm text-gray-700">
                    {pkg.sender_name}{" "}
                    {pkg.sender_phone && (
                      <span className="block text-xs text-gray-500">
                        {pkg.sender_phone}
                      </span>
                    )}
                    {pkg.sender_address && (
                      <span className="block text-xs text-gray-500">
                        {pkg.sender_address}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    To (Recipient)
                  </h3>
                  <p className="text-sm text-gray-700">
                    {pkg.recipient_name}{" "}
                    {pkg.recipient_phone && (
                      <span className="block text-xs text-gray-500">
                        {pkg.recipient_phone}
                      </span>
                    )}
                    {pkg.recipient_address && (
                      <span className="block text-xs text-gray-500">
                        {pkg.recipient_address}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Package metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm text-gray-700">
                <div>
                  <p className="text-gray-500 text-[11px] uppercase tracking-wide">
                    Package
                  </p>
                  <p className="font-medium">{pkg.package_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] uppercase tracking-wide">
                    Type
                  </p>
                  <p className="font-medium">{pkg.package_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px] uppercase tracking-wide">
                    Weight
                  </p>
                  <p className="font-medium">{pkg.weight} kg</p>
                </div>
                {pkg.value !== null && (
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase tracking-wide">
                      Value (est.)
                    </p>
                    <p className="font-medium">{pkg.value}</p>
                  </div>
                )}
              </div>

              {/* Package photo (if provided) */}
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                    Package Photo
                  </p>
                  <div className="w-full max-w-md">
                    <img
                      src={imageUrl}
                      alt="Uploaded package"
                      className="w-full rounded-xl border border-gray-200 object-cover max-h-64"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto flex justify-around py-2">
          {/* Home */}
          <button
            type="button"
            onClick={goHome}
            className="flex flex-col items-center text-xs font-medium text-gray-500 hover:text-[#73C2FB]"
          >
            <span className="text-lg">🏠</span>
            <span>Home</span>
          </button>

          {/* Track (active) */}
          <div className="flex flex-col items-center text-xs font-semibold text-[#73C2FB]">
            <span className="text-lg">🔍</span>
            <span>Track</span>
          </div>

          {/* My Account placeholder */}
          <button
            type="button"
            onClick={() =>
              alert("My Account (demo) – authentication coming soon.")
            }
            className="flex flex-col items-center text-xs font-medium text-gray-500 hover:text-[#73C2FB]"
          >
            <span className="text-lg">👤</span>
            <span>My Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default TrackPage;
