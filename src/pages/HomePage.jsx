// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
    const navigate = useNavigate();

    const goHome = () => navigate("/home");
    const goSend = () => navigate("/submit");
    const goTrack = () => navigate("/track");
    const goSupport = () => navigate("/support");
    const goAccount = () => {
        // For now, just a placeholder – could later open a real account page
        alert("My Account (demo) – coming soon.");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#73C2FB] via-white to-[#7E191B]/10 flex flex-col pb-16">
            {/* Top logo/header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex items-center gap-2"
                    >
                        <img
                            src="/senderplus-logo.png"
                            alt="SenderPlus logo"
                            className="h-8"
                        />
                    </button>
                </div>
            </header>

            {/* Hero content */}
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-center">
                    {/* Text side */}
                    <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                            Campus delivery,
                            <span className="block text-[#7E191B]">
                                reimagined for students.
                            </span>
                        </h1>

                        <p className="mt-4 text-sm md:text-base text-gray-600 max-w-md">
                            SenderPlus makes it easy for families and friends to send
                            packages to students at the University of Ghana and the Kwame Nkrumah University of Science and Technology — without the long trips to crowded bus stations.
                        </p>

                        {/* Main action buttons */}
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={goSend}
                                className="bg-[#73C2FB] hover:bg-[#61B2EB] text-white font-semibold px-6 py-2.5 rounded-full shadow-sm text-sm md:text-base"
                            >
                                Send a Package
                            </button>
                            <button
                                type="button"
                                onClick={goTrack}
                                className="border border-[#73C2FB] text-[#73C2FB] hover:bg-[#73C2FB] hover:text-white font-semibold px-6 py-2.5 rounded-full text-sm md:text-base"
                            >
                                Track a Package
                            </button>
                            <button
                                type="button"
                                onClick={goSupport}
                                className="border border-[#7E191B] text-[#7E191B] hover:bg-[#7E191B] hover:text-white font-semibold px-6 py-2.5 rounded-full text-sm md:text-base"
                            >
                                Customer Support
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                            Bridging Ghana One Package at a Time.
                        </p>
                    </div>

                    {/* Image side */}
                    <div className="relative">
                        <div className="absolute -top-6 -left-4 w-24 h-24 rounded-3xl bg-[#73C2FB]/20 blur-lg" />
                        <div className="absolute -bottom-6 -right-4 w-32 h-32 rounded-full bg-[#7E191B]/10 blur-lg" />
                        <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                            <img
                                src="/hero-package.jpg"
                                alt="Person holding a delivery package"
                                className="w-full h-64 md:h-80 object-cover"
                            />
                            <div className="p-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Live package tracking
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Real-time updates from bus station to campus hub to doorstep—
                                    designed for Ghanaian students and their families.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom navigation bar */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-sm">
                <div className="max-w-md mx-auto flex justify-around py-2">
                    {/* Home - active */}
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex flex-col items-center text-xs font-medium text-[#73C2FB]"
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

                    {/* My Account */}
                    <button
                        type="button"
                        onClick={goAccount}
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

export default HomePage;
