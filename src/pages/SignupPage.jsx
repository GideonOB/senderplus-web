import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form);
      navigate("/confirm", {
        state: {
          email: form.email,
          purpose: "signup",
        },
      });
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />

      <div className="auth-card w-full max-w-2xl p-7 md:p-9">
        <p className="auth-kicker">Create your Sender+ account</p>
        <h1 className="text-3xl font-bold text-slate-900">Get started</h1>
        <p className="mt-2 text-sm text-slate-600">
          Build your profile once and unlock seamless pickups, smart tracking, and instant updates.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="first_name">
              First name
            </label>
            <input id="first_name" className="auth-input" name="first_name" placeholder="Ada" value={form.first_name} onChange={onChange} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="last_name">
              Last name
            </label>
            <input id="last_name" className="auth-input" name="last_name" placeholder="Lovelace" value={form.last_name} onChange={onChange} required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="phone_number">
              Phone number
            </label>
            <input
              id="phone_number"
              className="auth-input"
              name="phone_number"
              placeholder="0241234567 or +233241234567"
              value={form.phone_number}
              onChange={onChange}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="address">
              Address
            </label>
            <input id="address" className="auth-input" name="address" placeholder="Street, city, landmark" value={form.address} onChange={onChange} required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="email">
              Email
            </label>
            <input id="email" className="auth-input" type="email" name="email" placeholder="name@example.com" value={form.email} onChange={onChange} required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="password">
              Password
            </label>
            <input id="password" className="auth-input" type="password" name="password" placeholder="Minimum 8 characters" value={form.password} onChange={onChange} required />
          </div>

          <button type="submit" disabled={loading} className="auth-button md:col-span-2 w-full">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-sky-600 transition hover:text-sky-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
