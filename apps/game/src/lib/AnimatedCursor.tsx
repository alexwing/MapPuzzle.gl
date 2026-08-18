import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";
import { PieceProps } from "../models/Interfaces";
import type { CustomCentroids } from "@mappuzzle/shared";
import type { ViewState } from "react-map-gl";

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
  bearing?: number;
  pitch?: number;
  view: ViewState;
  feedbackStatus?: "success" | "fail" | null;
}

function AnimatedCursor({
  clickScale = 0.7,
  selected,
  centroid,
  tooltip = "",
  zoom = 2,
  bearing = 0,
  pitch = 0,
  view,
  feedbackStatus = null,
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
      bearing={bearing}
      pitch={pitch}
      view={view}
      tooltip={tooltip}
      feedbackStatus={feedbackStatus}
    />
  );
}
export default AnimatedCursor;
