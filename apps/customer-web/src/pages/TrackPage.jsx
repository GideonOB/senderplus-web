import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { apiFetch } from "../api";
import { useAuth } from "../authContext";
import SettingsMenu from "../components/SettingsMenu";

const STATUS_STEPS = [
  ["waiting_bus", "Waiting for package to reach bus station"],
  ["en_route_campus", "Package in our van en route to campus"],
  ["at_campus_hub", "Package at our campus hub"],
  ["delivered", "Package delivered to recipient"],
];

function trackingResult({ tracking_id, status, status_display, updated_at }) {
  return { tracking_id, status, status_display, updated_at };
}

const TrackPage = () => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const homePath = isAuthenticated ? "/home" : "/";
  const [trackingIdInput, setTrackingIdInput] = useState(location.state?.trackingId || "");
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trackingId = trackingIdInput.trim();
    setPkg(null);
    if (!trackingId) {
      setError("Please enter a tracking ID.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/track/${encodeURIComponent(trackingId)}`);
      if (response.status === 404) {
        setError("We couldn’t find a package with that ID. Please confirm the code from the sender.");
        return;
      }
      if (!response.ok) throw new Error();
      setPkg(trackingResult(await response.json()));
    } catch {
      setError("Could not check tracking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    setAdvancing(true);
    setError("");
    try {
      const response = await apiFetch(
        `/advance-status/${encodeURIComponent(pkg.tracking_id)}`,
        { method: "POST" },
        token
      );
      if (response.status === 401 || response.status === 403) {
        setError("Your account does not have permission to update this delivery.");
        return;
      }
      if (!response.ok) throw new Error();
      setPkg(trackingResult(await response.json()));
    } catch {
      setError("Could not advance package status. Please try again.");
    } finally {
      setAdvancing(false);
    }
  };

  const currentStatusIndex = STATUS_STEPS.findIndex(([status]) => status === pkg?.status);

  return (
    <div className="plush-shell min-h-screen pb-20">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />

      <header className="plush-nav mx-auto mt-4 max-w-6xl px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link to={homePath}>
            <img src="/senderplus-logo.png" alt="Sender+ home" className="h-8 w-auto" />
          </Link>
          <nav className="flex gap-2 text-sm sm:gap-3" aria-label="Main navigation">
            <Link to={homePath} className="plush-nav-link">Home</Link>
            <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700" aria-current="page">Track</span>
            <SettingsMenu showLogout={isAuthenticated} />
          </nav>
        </div>
      </header>

      <main className="mx-auto mt-4 w-full max-w-6xl space-y-6 px-4 sm:px-5">
        <section className="plush-card p-6 md:p-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900 md:text-4xl">Track a Package</h1>
          <p className="mb-5 text-sm text-slate-600 md:text-base">Enter your tracking ID to check the delivery status.</p>

          <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <label htmlFor="tracking-id" className="sr-only">Tracking ID</label>
            <input
              id="tracking-id"
              type="text"
              value={trackingIdInput}
              onChange={(event) => setTrackingIdInput(event.target.value)}
              placeholder="e.g., dbd92eb6"
              className="auth-input flex-1"
            />
            <button type="submit" disabled={loading || advancing} className="auth-button px-5 py-2.5">
              {loading ? "Checking..." : "Track Package"}
            </button>
          </form>

          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
        </section>

        {pkg && (
          <section className="plush-card p-6 md:p-8" aria-label="Tracking result" aria-live="polite">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="plush-label mb-0.5">Tracking ID</p>
                <p className="font-mono text-sm font-semibold md:text-base">{pkg.tracking_id}</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  {pkg.status_display || pkg.status}
                </p>
                {pkg.updated_at && (
                  <p className="text-xs text-slate-600">
                    Last updated <time dateTime={pkg.updated_at}>{new Date(pkg.updated_at).toLocaleString()}</time>
                  </p>
                )}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {advancing ? "Updating status..." : "Advance Status"}
                  </button>
                )}
              </div>
            </div>
            <h2 className="plush-label mb-2">Journey Progress</h2>
            <ol className="space-y-2">
              {STATUS_STEPS.map(([status, step], index) => {
                const reached = index <= currentStatusIndex;
                return (
                  <li key={status} aria-current={index === currentStatusIndex ? "step" : undefined} className="flex items-start gap-3 text-sm">
                    <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      reached ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {reached && <span className="text-[10px]">✓</span>}
                    </span>
                    <span className={reached ? "font-medium text-slate-900" : "text-slate-600"}>{step}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </main>

      <nav className="plush-bottom-nav" aria-label="Quick navigation">
        <div className="mx-auto flex max-w-md justify-around py-2 text-xs font-medium text-slate-600">
          <Link className="flex flex-col items-center hover:text-sky-600" to={homePath}>
            <span className="text-lg" aria-hidden="true">🏠</span>
            Home
          </Link>
          <span aria-current="page" className="flex flex-col items-center font-semibold text-sky-600">
            <span className="text-lg" aria-hidden="true">🔍</span>
            Track
          </span>
          {isAuthenticated ? (
            <>
              <Link className="flex flex-col items-center hover:text-sky-600" to="/deliveries">
                <span className="text-lg" aria-hidden="true">📦</span>
                My deliveries
              </Link>
              <Link className="flex flex-col items-center hover:text-sky-600" to="/profile">
                <span className="text-lg" aria-hidden="true">👤</span>
                My Account
              </Link>
            </>
          ) : (
            <Link className="flex flex-col items-center hover:text-sky-600" to="/login">
              <span className="text-lg" aria-hidden="true">👤</span>
              Log in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default TrackPage;
