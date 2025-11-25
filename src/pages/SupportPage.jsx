// src/pages/SupportPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const SupportPage = () => {
    const navigate = useNavigate();

    const goHome = () => navigate("/home");
    const goTrack = () => navigate("/track");
    const goAccount = () => {
        alert("My Account (demo) – coming soon.");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
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
                    <span className="text-xs text-gray-500">
                        Customer Support
                    </span>
                </div>
            </header>

            <main className="flex-1 flex justify-center px-4 py-8">
                <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-[#73C2FB] mb-2">
                        We’re here to help
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        For demo purposes, these are sample support channels. In a live
                        deployment, Sender+ will offer WhatsApp, in-app chat, and phone
                        support for students and families.
                    </p>

                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-800">
                                Phone / WhatsApp
                            </p>
                            <p className="text-gray-600">+233 (0) 24 000 0000</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                Email
                            </p>
                            <p className="text-gray-600">support@senderplus.com</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                Hours
                            </p>
                            <p className="text-gray-600">
                                Monday – Saturday, 8:00am – 8:00pm GMT
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom nav */}
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

export default SupportPage;
