import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../authContext";
import { useTheme } from "../themeContext";

const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "forest", label: "Forest" },
];

const SettingsMenu = ({ showLogout = true }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Open settings"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">⚙️</span>
        <span className="hidden sm:inline">Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
          <div className="space-y-1.5">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${theme === option.id ? "bg-sky-500 font-semibold text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {showLogout && (
            <>
              <div className="my-3 border-t border-slate-200" />
              <button type="button" onClick={handleLogout} className="w-full rounded-xl bg-rose-50 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
