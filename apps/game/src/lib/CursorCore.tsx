/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useRef } from "react";
import type { CustomCentroids } from "@mappuzzle/shared";
import { PieceProps } from "../models/Interfaces";
import { useEventListener } from "./hooks/useEventListener";
import { pieceBox, pieceSilhouette } from "@mappuzzle/core";
import { setColor } from "./Utils";
import "./CursorCore.css";

/**
 * Cursor Core
 * Replaces the native cursor with a custom animated cursor, consisting
 * of an inner and outer dot that scale inversely based on hover or click.
 *
 * @author Alejandro Aranda (github.com/alexwing)
 * @author Fork from Stephen Scaff (github.com/stephenscaff)
 *
 * @param {number} clickScale - inner cursor scale amount
 */

/**
 * Web Mercator metres per pixel at zoom 0.
 *
 * deck.gl lays the world out on 512-pixel tiles, so a metre of EPSG:3857 — the
 * units pieceSilhouette works in — is 2^zoom / this many pixels. It is the
 * number the map itself draws with, so a piece scaled by it is the size of the
 * hole it has to fill. It used to be 74000, which drew every dragged piece 5.8%
 * too large; invisible while nothing overlaid them, not invisible now.
 */
const METRES_PER_PIXEL_AT_ZOOM_0 = (2 * Math.PI * 6378137) / 512;

interface CursorCoreProps {
  clickScale: number;
  selected: PieceProps;
  centroid: CustomCentroids;
  tooltip: string;
  zoom: number;
  /** Map bearing in degrees, clockwise. */
  bearing: number;
  /** Map pitch in degrees away from straight down. */
  pitch: number;
}

function CursorCore({
  clickScale = 0.7,
  selected,
  centroid,
  tooltip = "",
  zoom = 2,
  bearing = 0,
  pitch = 0,
}: CursorCoreProps): JSX.Element {
  const pieceCursorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const coords = useRef({ x: 0, y: 0 });
  const endX = useRef(0);
  const endY = useRef(0);
  const isVisibleRef = useRef(false);
  const isActiveRef = useRef(false);
  const isActiveClickableRef = useRef(false);
  // Read inside the animation frame rather than closed over, so turning the map
  // does not tear the loop down and build it again on every view change.
  const attitude = useRef({ bearing: 0, pitch: 0 });

  useEffect(() => {
    attitude.current = { bearing, pitch };
  }, [bearing, pitch]);

  // Primary Mouse Move event without triggering React re-renders
  const onMouseMove = useCallback(
    ({ clientX, clientY }: MouseEvent) => {
      endX.current = clientX;
      endY.current = clientY;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        if (tooltipRef.current) tooltipRef.current.style.opacity = "1";
        if (pieceCursorRef.current) pieceCursorRef.current.style.opacity = "1";
      }

      if (tooltipRef.current) {
        const scale = isActiveRef.current ? clickScale : 1;
        tooltipRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) scale(${scale})`;
      }
    },
    [clickScale]
  );

  // Outer Cursor Animation with RAF and lerp positioning on GPU
  const animateOuterCursor = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined && pieceCursorRef.current) {
        coords.current.x += (endX.current - coords.current.x) / 8;
        coords.current.y += (endY.current - coords.current.y) / 8;
        const scale =
          isActiveRef.current || isActiveClickableRef.current ? clickScale : 1;
        // The map's attitude, given to the piece.
        //
        // Turn it by -bearing, then squash the screen's vertical axis by
        // cos(pitch): that pair is exactly how an orthographic camera lays the
        // ground plane onto the screen, and it is the foreshortening the real
        // map applies in the middle of the viewport, where you are looking.
        //
        // Not the true perspective, on purpose. Projected properly the same
        // piece is 31 pixels tall at the top of a 60° view and 177 at the
        // bottom — it would stop being a silhouette you can recognise. This
        // holds its shape wherever the cursor goes.
        //
        // Rightmost applies first, so the rotation happens in the piece's own
        // space and the squash in the screen's, which is the order that matches.
        const { bearing: b, pitch: p } = attitude.current;
        const tilt = Math.cos((p * Math.PI) / 180);
        pieceCursorRef.current.style.transform =
          `translate3d(${coords.current.x}px, ${coords.current.y}px, 0)` +
          ` scale(${scale}) scaleY(${tilt}) rotate(${-b}deg)`;
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animateOuterCursor);
    },
    [clickScale]
  );

  // RAF lifecycle
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateOuterCursor);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animateOuterCursor]);

  useEventListener("mousemove", onMouseMove);

  // Event delegation for clickable elements and viewport tracking
  useEffect(() => {
    const isClickable = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof Element)) return false;
      return Boolean(
        el.closest(
          'a, input[type="submit"], input[type="image"], label[for], select, button, .link'
        )
      );
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (isClickable(e.target)) {
        isActiveRef.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (isClickable(e.target)) {
        isActiveRef.current = false;
        isActiveClickableRef.current = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isClickable(e.target)) {
        isActiveClickableRef.current = true;
      } else {
        isActiveRef.current = true;
      }
    };

    const handleMouseUp = () => {
      isActiveRef.current = false;
      isActiveClickableRef.current = false;
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      if (pieceCursorRef.current) pieceCursorRef.current.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "1";
      if (pieceCursorRef.current) pieceCursorRef.current.style.opacity = "1";
    };

    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  let PieceCursor;
  const box = pieceBox(selected);
  if (box) {
    const scale = Math.pow(2, zoom);
    const sizeX = (parseInt(box.split(" ")[2]) * scale) / METRES_PER_PIXEL_AT_ZOOM_0;
    const sizeY = (parseInt(box.split(" ")[3]) * scale) / METRES_PER_PIXEL_AT_ZOOM_0;
    let marginLeft = "-50%";
    let marginTop = "-50%";
    if (centroid.id) {
      marginLeft = centroid.left + "%";
      marginTop = centroid.top + "%";
    }
    const { poly } = pieceSilhouette(selected, Math.max(sizeX, sizeY));
    PieceCursor = (
      <svg
        width={sizeX + "px"}
        height={sizeY + "px"}
        viewBox={box}
        style={{
          border: "0px solid lightgray",
          marginLeft: marginLeft,
          marginTop: marginTop,
        }}
      >
        <path
          d={poly}
          stroke="black"
          strokeWidth="0"
          fill={setColor(selected.properties.mapcolor || 0)}
        />
      </svg>
    );
  }

  return (
    <React.Fragment>
      <div ref={pieceCursorRef} className="mousePiece">
        {PieceCursor}
      </div>
      {tooltip ? (
        <div ref={tooltipRef} className="tooltipRef">
          <span>{tooltip}</span>
        </div>
      ) : null}
    </React.Fragment>
  );
}

export default CursorCore;
