import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MapPuzzle from './MapPuzzle';
import content from './content/content.json';

ReactDOM.render(
  <React.StrictMode>
    <MapPuzzle content={content} />
  </React.StrictMode>,
  document.getElementById('root')
);

