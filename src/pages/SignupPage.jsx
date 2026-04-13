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
      navigate("/home");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#73C2FB] mb-2">Create account</h1>
        <p className="text-sm text-gray-600 mb-6">Join Sender+ and set up your delivery profile.</p>

        {error && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" name="first_name" placeholder="First name" value={form.first_name} onChange={onChange} required />
          <input className="input" name="last_name" placeholder="Last name" value={form.last_name} onChange={onChange} required />
          <input className="input md:col-span-2" name="phone_number" placeholder="Phone (e.g. 0241234567 or +233241234567)" value={form.phone_number} onChange={onChange} required />
          <input className="input md:col-span-2" name="address" placeholder="Address" value={form.address} onChange={onChange} required />
          <input className="input md:col-span-2" type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <input className="input md:col-span-2" type="password" name="password" placeholder="Password (min 8 chars)" value={form.password} onChange={onChange} required />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-[#73C2FB] text-white font-semibold py-2.5 rounded-lg hover:bg-[#61B2EB]"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
