/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import CustomCentroids from "../../backend/src/models/customCentroids";
import { PieceProps } from "../models/Interfaces";
import { useEventListener } from "./hooks/useEventListener";
import { setColor } from "./Utils";
import { getExtendFromGeometry, getSvgFromGeometry } from "./UtilsMap";
/**
 * Cursor Core
 * Replaces the native cursor with a custom animated cursor, consisting
 * of an inner and outer dot that scale inversely based on hover or click.
 *
 * @author Alejandro Aranda (github.com/alexwing)
 * @author Folk from Stephen Scaff (github.com/stephenscaff)
 *
 * @param {number} clickScale - inner cursor scale amount
 *
 */

interface CursorCoreProps {
  clickScale: number;
  selected: PieceProps;
  centroid: CustomCentroids;
  tooltip: string;
  zoom: number;
}

function CursorCore({
  clickScale = 0.7,
  selected,
  centroid,
  tooltip = "",
  zoom = 2,
}: CursorCoreProps): JSX.Element {
  const pieceCursorRef: any = useRef();
  const tooltipRef: any = useRef();
  const requestRef: any = useRef();
  const previousTimeRef: any = useRef();
  const [coords, setCoords]: any = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isActiveClickable, setIsActiveClickable] = useState(false);
  const endX = useRef(0);
  const endY = useRef(0);
 const [extend, setExtend] = useState({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    with: 0,
    height: 0,
  }); 
  const [svg, setSvg] = useState(<span></span>);
  const [selectedChanged, setSelectedChanged] = useState({} as PieceProps);
  

  useMemo(() => {
    if (selectedChanged !== selected && selected.geometry) {
      setExtend(getExtendFromGeometry(selected));
      setSelectedChanged(selected);
      setSvg(getSvgFromGeometry(selected));
    }
  }, [selected]);

  // Primary Mouse Move event
  const onMouseMove = useCallback(({ clientX, clientY }: any) => {
    setCoords({ x: clientX, y: clientY });
    tooltipRef.current.style.top = clientY + "px";
    tooltipRef.current.style.left = clientX + "px";
    endX.current = clientX;
    endY.current = clientY;
  }, []);

  // Outer Cursor Animation Delay
  const animateOuterCursor = useCallback(
    (time: any) => {
      if (previousTimeRef)
        if (previousTimeRef.current !== undefined && pieceCursorRef && coords) {
          coords.x += (endX.current - coords.x) / 8;
          coords.y += (endY.current - coords.y) / 8;
          if (pieceCursorRef.current) {
            pieceCursorRef.current.style.top = coords.y + "px";
            pieceCursorRef.current.style.left = coords.x + "px";
          }
        }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animateOuterCursor);
    },
    [requestRef] // eslint-disable-line
  );

  // RAF for animateOuterCursor
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateOuterCursor);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [animateOuterCursor]);

  // Mouse Events State updates
  const onMouseDown = useCallback(() => {
    setIsActive(true);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsActive(false);
  }, []);

  const onMouseEnterViewport = useCallback(() => {
    setIsVisible(true);
  }, []);

  const onMouseLeaveViewport = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEventListener("mousemove", onMouseMove);
  useEventListener("mousedown", onMouseDown);
  useEventListener("mouseup", onMouseUp);
  useEventListener("mouseover", onMouseEnterViewport);
  useEventListener("mouseout", onMouseLeaveViewport);

  // Cursors Hover/Active State
  useEffect(() => {
    if (isActive) {
      tooltipRef.current.style.transform = `translateZ(0) scale(${clickScale})`;
      pieceCursorRef.current.style.transform = `translateZ(0) scale(${clickScale})`;
    } else {
      tooltipRef.current.style.transform = "translateZ(0) scale(1)";
      pieceCursorRef.current.style.transform = "translateZ(0) scale(1)";
    }
  }, [clickScale, isActive]);

  // Cursors Click States
  useEffect(() => {
    tooltipRef.current.style.transform = `translateZ(0) scale(${clickScale})`;
    if (isActiveClickable) {
      pieceCursorRef.current.style.transform = `translateZ(0) scale(${clickScale})`;
    }
  }, [clickScale, isActiveClickable]);

  // Cursor Visibility State
  useEffect(() => {
    if (isVisible) {
      tooltipRef.current.style.opacity = 1;
      pieceCursorRef.current.style.opacity = 1;
    } else {
      tooltipRef.current.style.opacity = 1;
      pieceCursorRef.current.style.opacity = 0;
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
        el.addEventListener("mouseup", () => {
          setIsActive(true);
        });
        el.addEventListener("mouseout", () => {
          setIsActive(false);
          setIsActiveClickable(false);
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
        el.removeEventListener("mouseup", () => {
          setIsActive(true);
        });
        el.removeEventListener("mouseout", () => {
          setIsActive(false);
          setIsActiveClickable(false);
        });
      });
    };
  }, [isActive]);

  // Hide / Show global cursor
  //document.body.style.cursor = 'none'

  let PieceCursor;
  if (selected.properties) {
    const width = extend.right - extend.left;
    const height = extend.top - extend.bottom;

    const scaleFactor = 74000;
    const scale = Math.pow(2, zoom);
    const sizeX =
      (width * scale)/ scaleFactor;
    const sizeY =
      (height * scale) / scaleFactor;
    let marginLeft = "-50%";
    let marginTop = "-50%";
    if (centroid.id) {
      marginLeft = centroid.left + "%";
      marginTop = centroid.top + "%";
    }
    PieceCursor = (
      <div
        style={{
          width: sizeX + "px",
          height: sizeY + "px",
          border: "0px solid lightgray",
          marginLeft: marginLeft,
          marginTop: marginTop,
        }}
      >
        {svg}
      </div>
    );
  } else {
    PieceCursor = <span></span>;
  }
  const TooltipCursor = tooltip ? <span>{tooltip}</span> : undefined;

  return (
    <React.Fragment>
      <div ref={pieceCursorRef} className="mousePiece">
        {PieceCursor}
      </div>
      <div ref={tooltipRef} className="tooltipRef">
        {TooltipCursor}
      </div>
    </React.Fragment>
  );
}

export default CursorCore;
