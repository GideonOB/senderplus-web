import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../authContext";
import { getSafeNextPath } from "../authRedirect";

export default function EmailConfirmationPage() {
  const { sendCode, isAuthenticated } = useAuth();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const next = getSafeNextPath(state?.next);
  if (isAuthenticated) return <Navigate to={next} replace />;
  const resend = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await sendCode({ email, purpose: "signup", next });
      setMessage("If this account is awaiting confirmation, a new link has been sent.");
    } catch (error) { setMessage(error.message || "Could not resend. Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="auth-shell"><div className="auth-card max-w-md p-7">
    <h1 className="text-3xl font-bold">Check your email</h1>
    <p className="my-4">Follow the confirmation link in the same browser you used to sign up. You can then sign in with your email and password.</p>
    <form onSubmit={resend} className="space-y-4">
      <label className="block">Email address<input type="email" className="auth-input mt-1" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button className="auth-button" disabled={busy}>{busy ? "Sending…" : "Resend confirmation link"}</button>
    </form>
    {message && <p className="mt-4" role="status">{message}</p>}
    <Link to={`/login?next=${encodeURIComponent(next)}`} className="mt-4 block underline">Back to sign-in</Link>
  </div></div>;
}
