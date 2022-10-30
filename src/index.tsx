import React from "react";
import MapPuzzle from "./MapPuzzle";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
const container = createRoot(document.getElementById("root") as HTMLElement);
container.render(
  <Router>
    <MapPuzzle />
  </Router>
);