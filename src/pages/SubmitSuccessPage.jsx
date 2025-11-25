// src/pages/SubmitSuccessPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SubmitSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const senderName = location.state?.senderName || "there";
    const trackingId = location.state?.trackingId || "";

    const goHome = () => navigate("/home");
    const goTrack = () =>
        navigate("/track", {
            state: {
                trackingId,
                fromSubmit: true,
            },
        });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
            {/* Top header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex items-center gap-2"
                    >
                        <span className="font-bold text-[#73C2FB] text-lg">
                            Sender+
                        </span>
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex justify-center items-center px-4 py-8">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-6 md:p-8 text-center">
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#73C2FB]/10 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-[#73C2FB] mb-2">
                        Hi {senderName},
                    </h1>

                    <p className="text-sm md:text-base text-gray-700 mb-3">
                        Your package submission is complete.
                    </p>

                    {trackingId && (
                        <p className="text-sm md:text-base text-gray-800 mb-4">
                            Your tracking code is{" "}
                            <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                                {trackingId}
                            </span>
                            .
                        </p>
                    )}

                    <p className="text-xs md:text-sm text-gray-500 mb-6">
                        In a full production version of Sender+, you would also receive
                        an email confirmation and updates using this tracking code.
                    </p>

                    <div className="flex flex-col md:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={goTrack}
                            disabled={!trackingId}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm ${trackingId
                                ? "bg-[#73C2FB] text-white hover:bg-[#61B2EB]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <span>🔍</span>
                            <span>Track this package</span>
                        </button>
                        <button
                            type="button"
                            onClick={goHome}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <span>🏠</span>
                            <span>Back to Home</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom navigation bar */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-sm">
                <div className="max-w-md mx-auto flex justify-around py-2">
                    {/* Home */}
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex flex-col items-center text-xs font-medium text-gray-500 hover:text-[#73C2FB]"
                    >
                        <span className="text-lg">🏠</span>
                        <span>Home</span>
                    </button>

                    {/* Track */}
                    <button
                        type="button"
                        onClick={goTrack}
                        className="flex flex-col items-center text-xs font-medium text-gray-500 hover:text-[#73C2FB]"
                    >
                        <span className="text-lg">🔍</span>
                        <span>Track</span>
                    </button>

                    {/* My Account (placeholder) */}
                    <button
                        type="button"
                        onClick={() =>
                            alert("My Account (demo) – coming soon.")
                        }
                        className="flex flex-col items-center text-xs font-medium text-gray-500 hover:text-[#73C2FB]"
                    >
                        <span className="text-lg">👤</span>
                        <span>My Account</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default SubmitSuccessPage;
