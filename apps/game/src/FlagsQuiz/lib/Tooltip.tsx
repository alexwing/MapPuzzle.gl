/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEventListener } from "../../lib/hooks/useEventListener";
/**
 * MouseEvent
 *  based on hover or click.
 *
 *
 */

interface MouseEventProps {
  tooltip: string;
}

function Tooltip({ tooltip = "" }: MouseEventProps): JSX.Element {
  const tooltipRef: any = useRef();
  const [isActive, setIsActive] = useState(false);
  const endX = useRef(0);
  const endY = useRef(0);

  // Primary Mouse Move event
  const onMouseMove = useCallback(({ clientX, clientY }: any) => {
    tooltipRef.current.style.top = clientY + "px";
    tooltipRef.current.style.left = clientX + "px";
    endX.current = clientX;
    endY.current = clientY;
  }, []);

  // Mouse Events State updates
  const onMouseDown = useCallback(() => {
    setIsActive(true);
  }, []);

  useEventListener("mousemove", onMouseMove);
  useEventListener("mousedown", onMouseDown);

  // Target all possible clickables
  useEffect(() => {
    const clickables = document.querySelectorAll(
      'a, input[type="submit"], input[type="image"], label[for], select, button, .link'
    );
    clickables.forEach((el: unknown): void => {
      if (el instanceof HTMLElement) {
        el.style.cursor = "none";

        el.addEventListener("mouseover", () => {
          setIsActive(true);
        });
        el.addEventListener("click", () => {
          setIsActive(true);
        });
      }
    });

    return () => {
      clickables.forEach((el) => {
        el.removeEventListener("mouseover", () => {
          setIsActive(true);
        });
        el.removeEventListener("click", () => {
          setIsActive(true);
        });
      });
    };
  }, [isActive]);

  const TooltipCursor = tooltip ? <span>{tooltip}</span> : undefined;

  return (
    <React.Fragment>
      <div ref={tooltipRef} className="tooltipRef">
        {TooltipCursor}
      </div>
    </React.Fragment>
  );
}

export default Tooltip;
