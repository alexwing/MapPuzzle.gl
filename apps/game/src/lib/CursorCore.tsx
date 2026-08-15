/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useRef } from "react";
import type { CustomCentroids } from "@mappuzzle/shared";
import { PieceProps } from "../models/Interfaces";
import { useEventListener } from "./hooks/useEventListener";
import { pieceBox, pieceSilhouette } from "@mappuzzle/core";
import { setColor } from "./Utils";
import { groundTransform, viewportFor } from "./pieceProjection";
import type { ViewState } from "react-map-gl";
import type { WebMercatorViewport } from "@deck.gl/core";
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
  /** The map's live view, for laying the piece on the ground when tilted. */
  view: ViewState;
}

function CursorCore({
  clickScale = 0.7,
  selected,
  centroid,
  tooltip = "",
  zoom = 2,
  bearing = 0,
  pitch = 0,
  view,
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
  const viewRef = useRef<ViewState>({} as ViewState);
  /** The piece as drawn, and where the pointer holds it. Pixels. */
  const shape = useRef({ width: 0, height: 0, grabX: 0, grabY: 0 });
  /** Rebuilt only when the view moves, not on every mouse move. */
  const viewport = useRef<{ of: ViewState | null; vp: WebMercatorViewport | null }>({
    of: null,
    vp: null,
  });

  useEffect(() => {
    attitude.current = { bearing, pitch };
    viewRef.current = view;
  }, [bearing, pitch, view]);

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
        // Two ways of putting the piece in step with the map, one per view.
        //
        // Flat, the map turns every shape by the same amount wherever it is, so
        // turning the piece by -bearing is exact and it keeps its silhouette.
        //
        // Tilted, that stops being true — a perspective camera foreshortens by
        // distance — so the piece is projected onto the ground under the
        // pointer instead, corner by corner, through the map's own viewport.
        // It changes shape as it travels, which is what the tilted view is
        // for: the piece belongs to the ground it is over.
        const { bearing: b, pitch: p } = attitude.current;
        const x = coords.current.x;
        const y = coords.current.y;
        let ground: string | null = null;

        if (p > 0) {
          const live = viewRef.current;
          if (viewport.current.of !== live) {
            // deck reports the canvas size it drew with alongside the camera;
            // react-map-gl's ViewState type does not declare those two, hence
            // the read. The window is the fallback: the map fills it.
            const canvas = live as unknown as { width?: number; height?: number };
            viewport.current = {
              of: live,
              vp: viewportFor(
                live,
                canvas?.width || window.innerWidth,
                canvas?.height || window.innerHeight
              ),
            };
          }
          if (viewport.current.vp) {
            ground = groundTransform(viewport.current.vp, live, {
              x,
              y,
              ...shape.current,
            });
          }
        }

        if (ground) {
          // The matrix already carries the position, so the click pulse is
          // applied afterwards, in screen space, about the pointer itself.
          pieceCursorRef.current.style.transform =
            scale === 1
              ? ground
              : `translate(${x}px, ${y}px) scale(${scale}) translate(${-x}px, ${-y}px) ${ground}`;
        } else {
          // Flat, or the ground could not be trusted — past the edge of the
          // world, or a corner behind the camera. When the margins have been
          // dropped for the tilted view the grab offset has to be put back by
          // hand, since it was the margins that used to supply it.
          const tilt = Math.cos((p * Math.PI) / 180);
          const offX = p > 0 ? x - shape.current.grabX : x;
          const offY = p > 0 ? y - shape.current.grabY : y;
          pieceCursorRef.current.style.transform =
            `translate3d(${offX}px, ${offY}px, 0)` +
            ` scale(${scale}) scaleY(${tilt}) rotate(${-b}deg)`;
        }
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
  const onTheGround = pitch > 0;
  if (box) {
    const scale = Math.pow(2, zoom);
    const sizeX = (parseInt(box.split(" ")[2]) * scale) / METRES_PER_PIXEL_AT_ZOOM_0;
    const sizeY = (parseInt(box.split(" ")[3]) * scale) / METRES_PER_PIXEL_AT_ZOOM_0;
    const leftPct = centroid.id ? centroid.left : -50;
    const topPct = centroid.id ? centroid.top : -50;

    // Where the pointer holds the piece, in the piece's own pixels.
    //
    // Flat, the margins below do this: they shift the svg so the grab point
    // lands on the div's corner, which is the pointer. Percentage margins
    // resolve against the containing block's WIDTH on both axes and
    // .mousePiece shrink-wraps the svg, so both offsets are fractions of
    // sizeX — a quirk, but the one the map editor's centroid picker was
    // calibrated against. It is reproduced rather than corrected here, so the
    // piece is held at the same point whichever view is on.
    shape.current = {
      width: sizeX,
      height: sizeY,
      grabX: (-leftPct / 100) * sizeX,
      grabY: (-topPct / 100) * sizeX,
    };

    const { poly } = pieceSilhouette(selected, Math.max(sizeX, sizeY));
    PieceCursor = (
      <svg
        width={sizeX + "px"}
        height={sizeY + "px"}
        viewBox={box}
        style={{
          border: "0px solid lightgray",
          // On the ground the transform carries the whole placement, grab
          // point included, so the margins would shift it twice.
          marginLeft: onTheGround ? 0 : leftPct + "%",
          marginTop: onTheGround ? 0 : topPct + "%",
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
