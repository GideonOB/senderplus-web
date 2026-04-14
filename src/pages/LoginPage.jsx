import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await signin({ email, password });
      if (data.requires_otp) {
        navigate("/confirm", {
          state: {
            email,
            purpose: "signin_device",
            challenge_token: data.challenge_token,
          },
        });
        return;
      }
      navigate("/home");
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#73C2FB] mb-2">Welcome back</h1>
        <p className="text-sm text-gray-600 mb-6">Sign in to continue with Sender+.</p>

        {error && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#73C2FB] text-white font-semibold py-2.5 rounded-lg hover:bg-[#61B2EB]"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          New here? <Link to="/signup" className="underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
