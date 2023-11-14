import React, { createContext, useState } from "react";

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
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState("light");

  // Provide the theme state and the function to update it
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div data-bs-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
