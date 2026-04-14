import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

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
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const attemptsRemaining = MAX_VERIFY_ATTEMPTS - attempts;
  const attemptsExhausted = attemptsRemaining <= 0;

  const handleChange = (index, value) => {
    const char = value.slice(-1);
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
    const paste = e.clipboardData.getData("text").trim();
    if (!paste) return;

    const chars = paste.slice(0, CODE_LENGTH).split("");
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

    if (attemptsExhausted) {
      setError("Too many attempts. Please resend a fresh code or restart.");
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
      setAttempts((prev) => prev + 1);
      const message = (err.message || "Code verification failed.").toLowerCase();
      if (message.includes("expired")) {
        setError("Your code is expired. Please resend a new code.");
      } else {
        setError(err.message || "Code verification failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Missing email context. Please start again.");
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    try {
      await sendCode({ email, purpose });
      setAttempts(0);
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setInfo("Code re-sent. Check your email/logs.");
    } catch (err) {
      setError(err.message || "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  const handleRestart = () => {
    navigate(purpose === "signup" ? "/signup" : "/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#73C2FB] text-center mb-2">{meta.title}</h2>
        <p className="text-sm text-gray-600 text-center mb-2">{meta.subtitle}</p>
        {email && <p className="text-xs text-center text-gray-500 mb-3">{email}</p>}
        <p className="text-xs text-center text-gray-500 mb-6">Attempts remaining: {Math.max(attemptsRemaining, 0)}</p>

        {error && (
          <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-xs">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 rounded bg-green-100 text-green-700 px-3 py-2 text-xs">
            {info}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 text-xs uppercase tracking-wide text-center">
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
                  className="w-10 h-12 md:w-12 md:h-14 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#73C2FB]"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || attemptsExhausted}
            className="w-full bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold py-2.5 rounded-lg shadow-sm transition disabled:opacity-70"
          >
            {submitting ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-xs text-gray-500 underline underline-offset-4 hover:text-gray-700 disabled:opacity-70"
          >
            {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="block w-full text-xs text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            Use a different email / restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCodePage;
