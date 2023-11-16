import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useContext, useEffect } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { StaticMap, ViewState } from "react-map-gl";
import { AlphaColor, colorStroke, hexToRgb, lineWidth, setColor } from "../lib/Utils";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ThemeContext from './ThemeProvider';
import { use } from 'i18next';

interface DeckMapProps {
  onClickMap: (e: PieceEvent) => void;
  onHoverMap: (e: PieceEvent) => void;
  onViewStateChange: (e: ViewStateEvent) => void;
  viewState: ViewState;
  founds:  Array<number>;
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
  const [layers, setLayers] = React.useState([] as Array<GeoJsonLayer>);
  const { theme } = useContext(ThemeContext);
  const [mapStyle, setMapStyle] = React.useState("");

  //set mapStyle by theme
  useEffect(() => {
    setMapStyle(theme === "light" ? "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json");
  } , [theme]);

  useEffect(() => {
      setLayers(
        new GeoJsonLayer({
          data: data,
          pointRadiusMinPixels: 6,
          getLineColor: colorStroke,
          getFillColor: (object: PieceProps) =>
            AlphaColor(
              { col: hexToRgb(setColor(object.properties.mapcolor)), alpha: founds.includes(object.properties.cartodb_id) ? 150 : 0 }            ),
          opacity: 1,
          pickable: true,
          lineWidthMinPixels: lineWidth,
          updateTriggers: {
            lineWidthMinPixels: lineWidth,
            getLineColor: colorStroke,
            getFillColor: (object: PieceProps) =>
              AlphaColor(
                { col: hexToRgb(setColor(object.properties.mapcolor)), alpha: founds?.includes(object.properties.cartodb_id) ? 150 : 0 }              ),
          },
          onClick: (info: PieceEvent) => onClickMap(info),
          onHover: (info: PieceEvent) => onHoverMap(info),
        })
      );
  }, [data, founds, onClickMap, onHoverMap, viewState]);

  return !viewState.zoom || !data ? null : (
    <React.Fragment>
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={[layers]}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing
        />
      </DeckGL>
    </React.Fragment>
  );
}
export default DeckMap;
