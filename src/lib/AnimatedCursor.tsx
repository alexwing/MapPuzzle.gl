import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";
import { PieceProps } from "../models/Interfaces";
import CustomCentroids from "../../backend/src/models/customCentroids";

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

interface AnimatedCursorProps {
  clickScale: number;
  selected: PieceProps;
  centroid: CustomCentroids;
  tooltip: string;
  zoom: number;
}

function AnimatedCursor({
  clickScale = 0.7,
  selected,
  centroid,
  tooltip = "",
  zoom = 2,
}: AnimatedCursorProps): JSX.Element | null {
  if (typeof navigator !== "undefined" && IsDevice?.any()) {
    return <React.Fragment></React.Fragment>;
  }
  return !zoom ? null : (
    <CursorCore
      clickScale={clickScale}
      selected={selected}
      centroid={centroid}
      zoom={zoom}
      tooltip={tooltip}
    />
  );
}
export default AnimatedCursor;
