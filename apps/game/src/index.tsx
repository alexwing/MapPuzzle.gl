import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerSW } from "virtual:pwa-register";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/MapPuzzle.css";
import "./styles/icons.css";
import "./styles/responsive.css";

const MapPuzzle = lazy(() => import("./MapPuzzle"));
const FlagQuiz = lazy(() => import("./FlagsQuiz/FlagQuiz"));

const container = createRoot(document.getElementById("root") as HTMLElement);

const App = () => {
  const isQuiz =
    window.location.href.includes("flagQuiz") ||
    window.location.search.includes("flagQuiz");
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<div />}>
          {isQuiz ? <FlagQuiz /> : <MapPuzzle />}
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};
container.render(<App />);

registerSW({ immediate: true });
