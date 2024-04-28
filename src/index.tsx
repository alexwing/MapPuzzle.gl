import React from "react";
import MapPuzzle from "./MapPuzzle";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import FlagQuiz from "./FlagsQuiz/FlagQuiz";
import { ThemeProvider } from "./components/ThemeProvider";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ServiceWorkerConfig } from "./models/Interfaces";



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

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    console.log("New content is available; please refresh.", registration);
  },
  onSuccess: (registration) => {
    console.log("Content is cached for offline use.", registration);
  },
} as ServiceWorkerConfig);
