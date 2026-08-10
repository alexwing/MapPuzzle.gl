import React, { useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { pieceSilhouette, setColor } from "@mappuzzle/core";
import type { PieceProps } from "@mappuzzle/shared";
import "./CentroidPicker.css";

/**
 * Sets where the drag cursor holds a piece, by dragging the grab point onto it.
 *
 * This replaces four arrow buttons driven by a slider labelled "Centre
 * accuracy" that was really their step size, with the numeric fields hidden and
 * a preview that disagreed with the game: it applied the offsets as pixels with
 * the sign flipped, while the game applies them as percentages. You nudged
 * numbers blind and the picture lied.
 *
 * The maths here is the game's, from CursorCore: the SVG starts at the cursor
 * and is then shifted by margin-left and margin-top, both percentages of the
 * SVG's own width — CSS resolves percentage margins against the containing
 * block's width on **both** axes, and .mousePiece shrink-wraps the SVG. So the
 * point of the piece that lands under the cursor sits at
 * (-left% x width, -top% x width) in piece pixels, which is what the marker
 * shows and what dragging it writes back.
 */

/** Width the piece is drawn at here. The offsets are relative to it. */
const WIDTH = 220;
/** Room around the piece so the grab point can sit outside it. */
const BASE_PADDING = 90;

interface CentroidPickerProps {
  piece: PieceProps;
  left: number;
  top: number;
  onChange: (offsets: { left: number; top: number }) => void;
}

function CentroidPicker({
  piece,
  left,
  top,
  onChange,
}: CentroidPickerProps): JSX.Element | null {
  const area = useRef<HTMLDivElement>(null);
  /**
   * A ref, not state: a move arriving in the same tick as the press would still
   * read state as false and be dropped. The state below is only for the cursor.
   */
  const draggingRef = useRef(false);
  const padding = useRef({
    top: BASE_PADDING,
    left: BASE_PADDING,
    bottom: BASE_PADDING,
    right: BASE_PADDING,
  });
  const [dragging, setDragging] = useState(false);

  const setDrag = (value: boolean) => {
    draggingRef.current = value;
    setDragging(value);
  };

  const silhouette = pieceSilhouette(piece, WIDTH);
  const [, , boxWidth, boxHeight] = silhouette.box.split(" ").map(Number);
  if (!boxWidth || !boxHeight) return null;

  const height = (WIDTH * boxHeight) / boxWidth;
  /** Where the grab point sits, in piece pixels. */
  const markerX = (-left / 100) * WIDTH;
  const markerY = (-top / 100) * WIDTH;

  /**
   * Room around the piece, grown so the marker is always on screen.
   *
   * Stored offsets reach -232%, which puts the grab point well past the piece's
   * own box — that is how a tall piece ends up held near its middle. The marker
   * is absolutely positioned, and that does not extend a scroll area, so without
   * this it could sit outside the stage: invisible and impossible to grab.
   * Frozen while dragging, or the piece would shift under the pointer as the
   * padding changed.
   */
  if (!draggingRef.current) {
    const breathing = 40;
    padding.current = {
      top: Math.max(BASE_PADDING, breathing - markerY),
      left: Math.max(BASE_PADDING, breathing - markerX),
      bottom: Math.max(BASE_PADDING, markerY - height + breathing),
      right: Math.max(BASE_PADDING, markerX - WIDTH + breathing),
    };
  }

  const offsetsFrom = (clientX: number, clientY: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return null;
    return {
      left: Number((((box.left - clientX) / WIDTH) * 100).toFixed(1)),
      top: Number((((box.top - clientY) / WIDTH) * 100).toFixed(1)),
    };
  };

  const moveTo = (event: React.PointerEvent) => {
    const offsets = offsetsFrom(event.clientX, event.clientY);
    if (offsets) onChange(offsets);
  };

  /** Puts the grab point at the middle of the piece, whatever its shape. */
  const centre = () =>
    onChange({
      left: -50,
      top: Number((-50 * (height / WIDTH)).toFixed(1)),
    });

  /** Arrow keys nudge, shift for a coarser step, for fine tuning by keyboard. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 5 : 1;
    const moves: Record<string, { left: number; top: number }> = {
      ArrowLeft: { left: step, top: 0 },
      ArrowRight: { left: -step, top: 0 },
      ArrowUp: { left: 0, top: step },
      ArrowDown: { left: 0, top: -step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({
      left: Number((left + move.left).toFixed(1)),
      top: Number((top + move.top).toFixed(1)),
    });
  };

  return (
    <div className="centroid-picker">
      <div className="d-flex align-items-center gap-3 mb-2">
        <span className="text-muted small">
          Drag the point to where the cursor should hold the piece.
        </span>
        <Button size="sm" variant="outline-secondary" onClick={centre}>
          Centre
        </Button>
      </div>

      <div
        className={"centroid-stage" + (dragging ? " dragging" : "")}
        style={{
          paddingTop: padding.current.top,
          paddingLeft: padding.current.left,
          paddingBottom: padding.current.bottom,
          paddingRight: padding.current.right,
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag(true);
          moveTo(event);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) moveTo(event);
        }}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Piece grab point"
      >
        {/* The piece sits at a fixed spot; the marker is what moves, which is
            the inverse of the game (there the cursor is fixed and the piece
            moves) but far easier to aim. */}
        <div ref={area} className="centroid-piece" style={{ width: WIDTH, height }}>
          <svg width={WIDTH} height={height} viewBox={silhouette.box}>
            <path
              d={silhouette.poly}
              fill={setColor(piece.properties.mapcolor || 0)}
            />
          </svg>
          {/* Inside the piece, so its offsets are measured from the same
              top-left corner the stored values are. */}
          <div
            className="centroid-marker"
            style={{ left: markerX, top: markerY }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="text-muted small mt-2">
        left <code>{left}</code>%, top <code>{top}</code>% of the piece width
      </div>
    </div>
  );
}

export default CentroidPicker;
