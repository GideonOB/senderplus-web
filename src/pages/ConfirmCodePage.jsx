import React, { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";

const CODE_LENGTH = 6;

const PURPOSE_META = {
  signup: {
    title: "Verify your email",
    subtitle: "We sent a 6-digit code to your email. Enter it to finish creating your account.",
  },
  signin_device: {
    title: "New browser check",
    subtitle: "For your security, enter the 6-digit code we sent to your email.",
  },
  password_change: {
    title: "Confirm password change",
    subtitle: "Enter the 6-digit code sent to your email to change your password.",
  },
};

const ConfirmCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyCode, sendCode } = useAuth();

  const email = location.state?.email || "";
  const purpose = location.state?.purpose || "signup";
  const challengeToken = location.state?.challenge_token || null;

  const meta = useMemo(() => PURPOSE_META[purpose] || PURPOSE_META.signup, [purpose]);

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  const handleChange = (index, value) => {
    const numericOnly = value.replace(/\D/g, "");
    const char = numericOnly.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    if (char && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const updated = [...digits];
      updated[index - 1] = "";
      setDigits(updated);
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const digitsOnly = paste.replace(/\D/g, "");
    if (!digitsOnly) return;

    const chars = digitsOnly.slice(0, CODE_LENGTH).split("");
    const updated = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < chars.length; i++) {
      updated[i] = chars[i];
    }
    setDigits(updated);
    const lastIndex = Math.min(chars.length - 1, CODE_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    const code = digits.join("");

    if (!email) {
      setError("Missing email context. Please start from login or signup again.");
      return;
    }

    if (!code || code.length < CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setSubmitting(true);
    setError("");
    setInfo("");

    try {
      await verifyCode({
        email,
        code,
        purpose,
        challenge_token: challengeToken,
      });

      if (purpose === "password_change") {
        navigate("/profile", { state: { passwordChanged: true } });
        return;
      }

      navigate("/home");
    } catch (err) {
      setError(err.message || "Code verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Missing email context. Please start again.");
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    try {
      await sendCode({ email, purpose });
      setInfo("Code re-sent. Check your email/logs.");
    } catch (err) {
      setError(err.message || "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />

      <div className="auth-card w-full max-w-md p-7 md:p-9">
        <p className="auth-kicker">Secure verification</p>
        <h2 className="text-3xl font-bold text-slate-900">{meta.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{meta.subtitle}</p>
        {email && <p className="mt-1 text-xs text-slate-500">{email}</p>}

        {info && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {info}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleContinue} className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              6-digit code
            </label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => (inputsRef.current[index] = el)}
                  className="auth-input h-12 w-10 px-0 text-center text-lg font-semibold md:h-14 md:w-12"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="auth-button w-full"
          >
            {submitting ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs font-medium text-slate-500 underline underline-offset-4 transition hover:text-slate-700 disabled:opacity-70"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCodePage;
