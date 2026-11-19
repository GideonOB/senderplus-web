import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../authContext";
import { getSafeNextPath } from "../authRedirect";
import SessionStatus from "../components/SessionStatus";

export default function AuthCallbackPage() {
  const { isAuthenticated, isLoading, error, provider } = useAuth();
  const [params] = useSearchParams();
  if (provider !== "supabase") return <Navigate to="/login" replace />;
  if (isLoading || error) return <SessionStatus />;
  if (isAuthenticated) return <Navigate to={getSafeNextPath(params.get("next"))} replace />;
  return <div className="auth-shell"><div className="auth-card max-w-md p-7">
    <h1 className="text-2xl font-bold">Continue to Sender+</h1>
    <p className="my-4">If your email is confirmed, sign in to continue. An expired link can be resent from the confirmation screen. Open confirmation links in the same browser you used to sign up.</p>
    <Link to="/login" className="auth-button">Go to sign-in</Link>
  </div></div>;
}
