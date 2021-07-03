import React from 'react';
import ReactDOM from 'react-dom';
import MapPuzzle from './MapPuzzle';
import { BrowserRouter as Router } from "react-router-dom";
import content from './content/content.json';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <MapPuzzle content={content} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

