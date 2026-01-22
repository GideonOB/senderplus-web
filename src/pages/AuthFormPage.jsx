// src/pages/AuthFormPage.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const AuthFormPage = ({ mode }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isSignup = mode === "signup";
  const title = isSignup ? "Create your account" : "Welcome back";
  const subtitle = isSignup
    ? "Enter your details so we can send a confirmation code."
    : "Sign in to get your confirmation code.";

  const footerText = isSignup
    ? "Already have an account?"
    : "New to Sender+?";
  const footerLink = isSignup ? "/login" : "/signup";
  const footerLinkLabel = isSignup ? "Sign in" : "Create an account";

  const formFields = useMemo(() => {
    const fields = [
      {
        id: "email",
        label: "Email address",
        type: "email",
        placeholder: "you@example.com",
        required: true,
      },
      {
        id: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        required: true,
      },
    ];

    if (isSignup) {
      fields.unshift({
        id: "fullName",
        label: "Full name",
        type: "text",
        placeholder: "Ama Boateng",
        required: true,
      });
      fields.push({
        id: "confirmPassword",
        label: "Confirm password",
        type: "password",
        placeholder: "Re-enter your password",
        required: true,
      });
    }

    return fields;
  }, [isSignup]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSignup && formValues.password !== formValues.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setError("");
    navigate("/confirm");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#73C2FB] to-[#7E191B] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-white">
        <div className="text-center mb-6">
          <img
            src="/senderplus-logo.png"
            alt="SenderPlus Logo"
            className="w-52 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold tracking-wide">{title}</h1>
          <p className="text-sm text-white/80 mt-1">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 rounded bg-white/90 text-[#7E191B] px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => (
            <div key={field.id}>
              <label className="block text-xs uppercase tracking-wide text-white/80 mb-1">
                {field.label}
              </label>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                value={formValues[field.id]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-white text-[#7E191B] font-semibold py-2.5 rounded-full shadow-sm hover:bg-gray-100 transition"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/80">
          {footerText}{" "}
          <Link
            to={footerLink}
            className="font-semibold text-white underline underline-offset-4"
          >
            {footerLinkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthFormPage;
