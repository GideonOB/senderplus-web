// src/pages/ChooseActionPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ChooseActionPage = () => {
  const navigate = useNavigate();

  const handleSend = () => {
    navigate("/submit");
  };

  const handleTrack = () => {
    navigate("/track");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 md:p-8 text-center">
        <h2 className="text-2xl font-bold text-[#73C2FB] mb-2">
          What would you like to do?
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose an option below to get started with SenderPlus.
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSend}
            className="w-full bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold py-2.5 rounded-lg shadow-sm transition"
          >
            Send a Package
          </button>
          <button
            type="button"
            onClick={handleTrack}
            className="w-full border border-[#73C2FB] text-[#73C2FB] font-semibold py-2.5 rounded-lg hover:bg-[#73C2FB] hover:text-white transition"
          >
            Track a Package
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseActionPage;
