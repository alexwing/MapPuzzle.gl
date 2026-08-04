import React from "react";
import "./Fireworks.scss";
/**
 * Fireworks
 * Pure CSS Fireworks
 *
 * @author Port to React: Alejandro Aranda (github.com/alexwing)
 * @author Script CSS: Eddie Lin (https://codepen.io/yshlin)
 *
 */
function Fireworks () : JSX.Element {
  return (
    <React.Fragment>
      <div className="pyro">
        <div className="before"></div>
        <div className="after"></div>
      </div>
    </React.Fragment>
  );
}
export default Fireworks;