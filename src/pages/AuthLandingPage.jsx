// src/pages/AuthLandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const AuthLandingPage = () => {
    const navigate = useNavigate();

    const handleSkip = () => {
        navigate("/confirm");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#73C2FB] to-[#7E191B] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center text-white">
                <div className="mb-6">
                    <img
                        src="/senderplus-logo.png"
                        alt="SenderPlus Logo"
                        className="w-52 mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold tracking-wide">
                        Welcome to SenderPlus
                    </h1>
                    <p className="text-sm text-white/80 mt-1">
                        Proudly Ghanaian. Bridging Ghana One Package at a Time.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        className="w-full bg-white text-[#7E191B] font-semibold py-2.5 rounded-full shadow-sm hover:bg-gray-100 transition"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        className="w-full border border-white/80 text-white font-semibold py-2.5 rounded-full hover:bg-white/10 transition"
                    >
                        Sign Up
                    </button>
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="text-xs text-white/80 underline underline-offset-4 hover:text-white"
                    >
                        Skip (demo)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthLandingPage;
