import React, { Component } from "react";
import "./Fireworks.scss";
/**
 * Fireworks
 * Pure CSS Fireworks
 *
 * @author Port to React: Alejandro Aranda (github.com/alexwing)
 * @author Script CSS: Eddie Lin (https://codepen.io/yshlin)
 *
 */

export default class Fireworks extends Component {
  render() {
    return (
      <div className="pyro">
        <div className="before"></div>
        <div className="after"></div>
      </div>
    );
  }
}
