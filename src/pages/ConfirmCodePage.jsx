// src/pages/ConfirmCodePage.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

const ConfirmCodePage = () => {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  const handleChange = (index, value) => {
    // Accept only digits/letters, take first char
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

  const handleContinue = (e) => {
    e.preventDefault();
    const code = digits.join("");

    if (!code || code.length < CODE_LENGTH) {
      setError("Please enter the full confirmation code (demo).");
      return;
    }

    // In a real app, you'd verify the code here.
    // For demo, we just move on.
    setError("");
    navigate("/start");
  };

  const handleSkip = () => {
    navigate("/start");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#73C2FB] text-center mb-2">
          Confirm Your Details
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          We’ve sent a one-time confirmation code to your phone or email
          (demo simulation). Enter it below or skip to continue.
        </p>

        {error && (
          <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 text-xs uppercase tracking-wide text-center">
              Confirmation Code
            </label>
            <div
              className="flex justify-center gap-2"
              onPaste={handlePaste}
            >
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
            className="w-full bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold py-2.5 rounded-lg shadow-sm transition"
          >
            Continue
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            Skip for now (demo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCodePage;
