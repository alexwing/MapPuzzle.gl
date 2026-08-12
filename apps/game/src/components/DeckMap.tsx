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
        controller={true}
        layers={layers}
        getCursor={getCursor}
      >
        <Map mapStyle={mapStyle} />
      </DeckGL>
    </React.Fragment>
  );
}
export default DeckMap;
