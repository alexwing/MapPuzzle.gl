import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";
import { PieceProps } from "../models/Interfaces";
import type { ViewState } from "react-map-gl";

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

interface AnimatedCursorProps {
  clickScale: number;
  selected: PieceProps;
  /** Where the pointer holds the piece, in percentages of its width. */
  grab: { left: number; top: number };
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
  grab,
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
      grab={grab}
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
