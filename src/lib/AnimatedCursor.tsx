import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function AnimatedCursor({
  clickScale = 0.7,
  selected = null,
  centroid = null,
  tooltip = "",
  zoom = 2,
}: any): JSX.Element | null {
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
