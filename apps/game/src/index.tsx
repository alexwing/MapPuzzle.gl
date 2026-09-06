import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerSW } from "virtual:pwa-register";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/MapPuzzle.css";
import "./styles/icons.css";
import "./styles/responsive.css";
import { puzzleFromLocation } from "./lib/Utils";
import ErrorBoundary from "./components/ErrorBoundary";

const MapPuzzle = lazy(() => import("./MapPuzzle"));
const FlagQuiz = lazy(() => import("./FlagsQuiz/FlagQuiz"));

const container = createRoot(document.getElementById("root") as HTMLElement);

const App = () => {
  // Either address shape: /flag-quiz/<slug>/ or the older /?flagQuiz=<slug>.
  const isQuiz = puzzleFromLocation()?.isQuiz ?? false;
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Suspense fallback={<div />}>
            {isQuiz ? <FlagQuiz /> : <MapPuzzle />}
          </Suspense>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
container.render(<App />);

registerSW({ immediate: true });
