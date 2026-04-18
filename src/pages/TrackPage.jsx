// src/pages/TrackPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../api";

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
          setError("We couldn’t find a package with that ID. Please confirm the code from the sender.");
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
      const res = await fetch(`${API_BASE_URL}/advance-status/${pkg.tracking_id}`, {
        method: "POST",
      });
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

  const currentStatusIndex = pkg && STATUS_STEPS.includes(statusLabel) ? STATUS_STEPS.indexOf(statusLabel) : -1;

  const imageUrl = pkg && pkg.photo_url ? (pkg.photo_url.startsWith("http") ? pkg.photo_url : `${API_BASE_URL}${pkg.photo_url}`) : null;

  return (
    <div className="plush-shell min-h-screen pb-20">
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
            <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700">Track</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto mt-4 flex w-full max-w-6xl justify-center px-4 sm:px-5">
        <div className="w-full space-y-6">
          <section className="plush-card p-6 md:p-8">
            <p className="auth-kicker">Live tracking</p>
            <h1 className="mb-2 text-3xl font-bold text-slate-900 md:text-4xl">Track a Package</h1>
            <p className="mb-5 text-sm text-slate-600 md:text-base">
              Enter the tracking ID and get a polished real-time view of where your shipment is in the Sender+ journey.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                placeholder="e.g., dbd92eb6"
                className="auth-input flex-1"
              />
              <button type="submit" disabled={loading} className="auth-button inline-flex items-center justify-center gap-2 px-5 py-2.5">
                <span>🔍</span>
                <span>{loading ? "Checking..." : "Track Package"}</span>
              </button>
            </form>

            {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
          </section>

          {pkg && (
            <section className="plush-card p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="plush-label mb-0.5">Tracking ID</p>
                  <p className="font-mono text-sm font-semibold md:text-base">{pkg.tracking_id}</p>
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    <span>📍</span>
                    <span>{statusLabel}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {advancing ? "Updating status..." : "Advance Status (demo)"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="plush-label mb-2">Journey Progress</p>
                  <ol className="space-y-2">
                    {STATUS_STEPS.map((step, index) => {
                      const reached = index <= currentStatusIndex;
                      return (
                        <li key={step} className="flex items-start gap-3 text-sm">
                          <div
                            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              reached ? "border-sky-500 bg-sky-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {reached && <span className="text-[10px] text-white">✓</span>}
                          </div>
                          <span className={reached ? "font-medium text-slate-900" : "text-slate-400"}>{step}</span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                    <h3 className="mb-1 text-sm font-semibold text-slate-800">From (Sender)</h3>
                    <p className="text-sm text-slate-700">
                      {pkg.sender_name}
                      {pkg.sender_phone && <span className="block text-xs text-slate-500">{pkg.sender_phone}</span>}
                      {pkg.sender_address && <span className="block text-xs text-slate-500">{pkg.sender_address}</span>}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                    <h3 className="mb-1 text-sm font-semibold text-slate-800">To (Recipient)</h3>
                    <p className="text-sm text-slate-700">
                      {pkg.recipient_name}
                      {pkg.recipient_phone && <span className="block text-xs text-slate-500">{pkg.recipient_phone}</span>}
                      {pkg.recipient_address && <span className="block text-xs text-slate-500">{pkg.recipient_address}</span>}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-700 md:grid-cols-4 md:text-sm">
                  <div>
                    <p className="plush-label">Package</p>
                    <p className="font-medium">{pkg.package_name}</p>
                  </div>
                  <div>
                    <p className="plush-label">Type</p>
                    <p className="font-medium">{pkg.package_type}</p>
                  </div>
                  <div>
                    <p className="plush-label">Weight</p>
                    <p className="font-medium">{pkg.weight} kg</p>
                  </div>
                  {pkg.value !== null && (
                    <div>
                      <p className="plush-label">Value (est.)</p>
                      <p className="font-medium">{pkg.value}</p>
                    </div>
                  )}
                </div>

                {imageUrl && (
                  <div>
                    <p className="plush-label mb-2">Package Photo</p>
                    <div className="w-full max-w-md">
                      <img src={imageUrl} alt="Uploaded package" className="max-h-64 w-full rounded-2xl border border-slate-200 object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <nav className="plush-bottom-nav">
        <div className="mx-auto flex max-w-md justify-around py-2">
          <button
            type="button"
            onClick={goHome}
            className="flex flex-col items-center text-xs font-medium text-slate-500 transition hover:text-sky-600"
          >
            <span className="text-lg">🏠</span>
            <span>Home</span>
          </button>

          <div className="flex flex-col items-center text-xs font-semibold text-sky-600">
            <span className="text-lg">🔍</span>
            <span>Track</span>
          </div>

          <button
            type="button"
            onClick={() => alert("My Account (demo) – authentication coming soon.")}
            className="flex flex-col items-center text-xs font-medium text-slate-500 transition hover:text-sky-600"
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
