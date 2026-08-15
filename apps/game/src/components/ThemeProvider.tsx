import React, { createContext, useEffect, useState } from "react";
import { getCookie } from "react-simple-cookie-store";

// Create a context with the default theme and function to update it
interface ThemeContextProps {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}
// Create a context with the default theme and function to update it
const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  setTheme: () => {
    // do nothing
  },
});

// Create a provider component
export const ThemeProvider = ({ children }: { children: React.ReactNode }): React.ReactElement | null => {
  const getSavedTheme = () => {
    const savedTheme = getCookie("theme");
    if (savedTheme) {
      return savedTheme;
    } else {
      const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return systemTheme;
    }
  }
  const [theme, setTheme] = useState(getSavedTheme());

  // Set data-bs-theme={theme} when the theme changes.
  //
  // On <html> as well as on <body>: index.html decides the theme before the
  // first paint, and the only element it can mark that early is <html>. If the
  // toggle then only wrote to <body>, the two would disagree — <html> would
  // still carry the old theme, and since only the dark tokens are keyed on the
  // attribute (the light ones live on :root), switching back to light would
  // keep inheriting the dark palette.
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);
  
  // Provide the theme state and the function to update it
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
