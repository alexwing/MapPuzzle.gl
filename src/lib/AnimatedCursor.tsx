import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
function AnimatedCursor({
  clickScale = 0.7,
  selected = null,
  centroid = null,
  tooltip = "",
  zoom = 2,
}) {
  if ((typeof navigator !== "undefined" && IsDevice?.any())) {
    return <React.Fragment></React.Fragment>;
  }
  return (
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
