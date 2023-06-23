/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import CustomCentroids from "../../../backend/src/models/customCentroids";
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
  const requestRef: any = useRef();
  const previousTimeRef: any = useRef();
  const [coords, setCoords]: any = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isActiveClickable, setIsActiveClickable] = useState(false);
  const endX = useRef(0);
  const endY = useRef(0);

  // Primary Mouse Move event
  const onMouseMove = useCallback(({ clientX, clientY }: any) => {
    setCoords({ x: clientX, y: clientY });
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

  // Cursor Visibility State
  useEffect(() => {
    if (isVisible) {
      tooltipRef.current.style.opacity = 1;
    } else {
      tooltipRef.current.style.opacity = 1;
    }
  }, [isVisible]);

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
          setIsActiveClickable(false);
        });
        el.addEventListener("mousedown", () => {
          setIsActiveClickable(true);
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
          setIsActiveClickable(false);
        });
        el.removeEventListener("mousedown", () => {
          setIsActiveClickable(true);
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
