/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useRef } from "react";
import { useEventListener } from "../../lib/hooks/useEventListener";

interface MouseEventProps {
  tooltip: string;
}

function Tooltip({ tooltip = "" }: MouseEventProps): JSX.Element {
  const tooltipRef: any = useRef();

  // Primary Mouse Move event
  const onMouseMove = useCallback(({ clientX, clientY }: any) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.top = clientY + "px";
      tooltipRef.current.style.left = clientX + "px";
    }
  }, []);

  useEventListener("mousemove", onMouseMove);

  return (
    <React.Fragment>
      {tooltip ? (
        <div ref={tooltipRef} className="tooltipRef">
          <span>{tooltip}</span>
        </div>
      ) : null}
    </React.Fragment>
  );
}

export default Tooltip;
