import React, { useContext, useMemo } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import {
  AlphaColor,
  colorStroke,
  hexToRgb,
  lineWidth,
  setColor,
} from "../lib/Utils";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ThemeContext from "./ThemeProvider";
import { useCanRotate } from "../lib/hooks/useCanRotate";
import Map, { ViewState } from "react-map-gl";

interface DeckMapProps {
  onClickMap: (e: PieceEvent) => void;
  onHoverMap: (e: PieceEvent) => void;
  onViewStateChange?: (e: ViewStateEvent) => void;
  viewState: ViewState;
  founds: Array<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

function DeckMap({
  onClickMap,
  onHoverMap,
  onViewStateChange,
  viewState,
  founds,
  data,
}: DeckMapProps): JSX.Element | null {
  const { theme } = useContext(ThemeContext);

  const mapStyle = useMemo(() => {
    return theme === "light"
      ? "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
  }, [theme]);

  const layers = useMemo(() => {
    if (!data) return [];
    return [
      new GeoJsonLayer({
        id: "geojson-layer",
        data: data,
        pointRadiusMinPixels: 6,
        getLineColor: colorStroke,
        getFillColor: (object: PieceProps) =>
          AlphaColor({
            col: hexToRgb(setColor(object?.properties?.mapcolor)),
            alpha: founds.includes(object?.properties?.cartodb_id) ? 150 : 0,
          }),
        opacity: 1,
        pickable: true,
        lineWidthMinPixels: lineWidth,
        updateTriggers: {
          getFillColor: [founds],
        },
        onClick: onClickMap,
        onHover: onHoverMap,
      }),
    ];
  }, [data, founds, onClickMap, onHoverMap]);

  /**
   * What the player is allowed to do to the view.
   *
   * Decided here rather than passed in, so both games get it: the flag quiz
   * mounts this same component, and it does not even listen for view changes.
   *
   * Below the breakpoint every way of turning or tilting has to be shut off
   * one at a time. dragRotate covers the right button and modifier-drag;
   * touchRotate is already off by default but is written down because a
   * default is not a promise. Keyboard rotation has no switch of its own —
   * shift with the arrows always reaches rotateLeft/Right/Up/Down — so the
   * speeds go to zero, which leaves arrow-key panning and +/- zoom alone.
   * maxPitch pins the tilt, and there is no minBearing/maxBearing in deck.gl
   * 8.9.36 to pin the turn with, which is why the keyboard speeds are not
   * optional.
   *
   * Memoised because it must be: the nested keyboard object would be a new
   * reference on every render, the view manager compares views by value, and
   * it would rebuild the viewports each time.
   */
  const canRotate = useCanRotate();
  const controller = useMemo(
    () =>
      canRotate
        ? true
        : {
            dragRotate: false,
            touchRotate: false,
            keyboard: { rotateSpeedX: 0, rotateSpeedY: 0 },
            minPitch: 0,
            maxPitch: 0,
          },
    [canRotate]
  );

  const getCursor = useMemo(() => {
    return ({ isDragging, isHovering }: { isDragging?: boolean; isHovering?: boolean }) => {
      if (isDragging) return "url('/cursors/grabbing.svg') 12 8, grabbing";
      if (isHovering) return "pointer";
      return "url('/cursors/grab.svg') 12 8, grab";
    };
  }, []);

  return !viewState?.zoom || !data ? null : (
    <React.Fragment>
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={controller}
        layers={layers}
        getCursor={getCursor}
      >
        <Map mapStyle={mapStyle} />
      </DeckGL>
    </React.Fragment>
  );
}
/**
 * Deliberately NOT memoised.
 *
 * @deck.gl/react calls deck.setProps on every render of this component, and
 * that is what keeps deck's own clock moving: memoise it and a running
 * animation gets one update and then jumps straight to its end, because the
 * next tick it sees is already past the duration. Measured — the tilt went
 * from 0° to 45° in six milliseconds with two frames in between.
 *
 * The parent re-renders on every frame the map reports, which is what drives
 * it. That is only safe because what the parent commands and what the map
 * reports are now two separate pieces of state, so those renders arrive with
 * the very same initialViewState object and deck has nothing to adopt.
 */
export default DeckMap;
