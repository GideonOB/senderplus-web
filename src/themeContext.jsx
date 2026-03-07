import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "senderplus-theme";
const THEMES = ["light", "dark", "forest"];

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  themes: THEMES,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
