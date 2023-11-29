import React from "react";
import MapPuzzle from "./MapPuzzle";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import FlagQuiz from "./FlagsQuiz/FlagQuiz";
import { ThemeProvider } from "./components/ThemeProvider";

const container = createRoot(document.getElementById("root") as HTMLElement);

const App = () => {
  const Game = window.location.href.includes("flagQuiz") ? FlagQuiz : MapPuzzle;
  return (
    <ThemeProvider>
      <Router>
        <Game />
      </Router>
    </ThemeProvider>
  );
};
container.render(<App />);
