import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "senderplus-theme";
const THEMES = ["light", "dark", "ocean"];

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  themes: THEMES,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.remove("theme-light", "theme-dark", "theme-ocean");
    document.body.classList.add(`theme-${theme}`);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
