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

  //set data-bs-theme={theme} to body element when theme changes
  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    console.log("theme changed to: " + theme);
  }, [theme]);
  
  // Provide the theme state and the function to update it
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
