import React from "react";
import MapPuzzle from "./MapPuzzle";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import FlagQuiz from "./FlagsQuiz/FlagQuiz";
import { ThemeProvider } from "./components/ThemeProvider";
import FlagCards from "./FlagCards/flagCards";

const container = createRoot(document.getElementById("root") as HTMLElement);

const App = () => {
  const Game = () => {
    if (window.location.href.includes("flagQuiz")) {
      return <FlagQuiz />;
    } else if (window.location.href.includes("flagCards")) {
      return <FlagCards />;
    } else {
      return <MapPuzzle />;
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <Game />
      </Router>
    </ThemeProvider>
  );
};
container.render(<App />);
