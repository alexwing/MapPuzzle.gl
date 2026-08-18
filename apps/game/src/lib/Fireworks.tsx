import React from "react";
import "./Fireworks.scss";

/**
 * Fireworks
 * Pure GPU-accelerated CSS Fireworks with vivid luminous particles
 *
 * @author Port to React: Alejandro Aranda (github.com/alexwing)
 * @author Script CSS: Eddie Lin (https://codepen.io/yshlin)
 */
function Fireworks(): JSX.Element {
  return (
    <React.Fragment>
      <div className="pyro" aria-hidden="true">
        <div className="before"></div>
        <div className="after"></div>
        <div className="sparkles1"></div>
        <div className="sparkles2"></div>
      </div>
    </React.Fragment>
  );
}

export default Fireworks;