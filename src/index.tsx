import React from "react";
import MapPuzzle from "./MapPuzzle";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import FlagQuiz from "./FlagsQuiz/FlagQuiz";
const container = createRoot(document.getElementById("root") as HTMLElement);

//render MapPuzzle or FlagQuiz

//if url has ?flagQuiz then render FlagQuiz
if (window.location.search.includes("flagQuiz")) {
  container.render(
    <Router>
      <FlagQuiz />
    </Router>
  );
} else {
  //else render MapPuzzle
  container.render(
    <Router>
      <MapPuzzle />
    </Router>
  );
}
