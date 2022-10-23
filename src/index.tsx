import React from "react";
import ReactDOM from "react-dom";
import MapPuzzle from "./MapPuzzle";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <MapPuzzle/>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

/*
import { createRoot } from "react-dom/client";
import MapPuzzle from "./MapPuzzle";
import { BrowserRouter as Router } from "react-router-dom";
import React from "react";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Router>
        <MapPuzzle />
      </Router>
    </React.StrictMode>
  );
}
*/