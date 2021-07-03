import React from "react";
import IsDevice from "./helpers/isDevice";
import CursorCore from "./CursorCore";

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
function AnimatedCursor({
  color = "220, 90, 90",
  clickScale = 0.7,
  selected = null,
  tooltip = "",
  zoom = 2,
}) {
  if ((typeof navigator !== "undefined" && IsDevice?.any()) || !selected) {
    return <React.Fragment></React.Fragment>;
  }
  return (
    <CursorCore
      color={color}
      clickScale={clickScale}
      selected={selected}
      zoom={zoom}
      tooltip={tooltip}
    />
  );
}
export default AnimatedCursor;
