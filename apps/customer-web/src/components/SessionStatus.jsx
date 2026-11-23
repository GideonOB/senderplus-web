import { useAuth } from "../authContext";

export default function SessionStatus() {
  const { error, refreshProfile, logout } = useAuth();
  return <div className="auth-shell"><div className="auth-card max-w-md p-7" role="status">
    <p>{error || "Opening your account…"}</p>
    {error && <div className="mt-4 flex gap-4">
      <button className="auth-button" onClick={() => { void refreshProfile().catch(() => {}); }}>Try again</button>
      <button onClick={() => { void logout().catch(() => {}); }}>Return to sign-in</button>
    </div>}
  </div></div>;
}
