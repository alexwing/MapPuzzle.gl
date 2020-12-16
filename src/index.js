import React from 'react';
import ReactDOM from 'react-dom';
import MapPuzzle from './MapPuzzle';
import content from './content/content.json';
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <MapPuzzle content={content} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

