/* eslint-disable react/prop-types */
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useContext, useEffect } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView } from "@deck.gl/core";
import { StaticMap, ViewState } from "react-map-gl";
import { TileLayer } from "@deck.gl/geo-layers";
import { SolidPolygonLayer } from "@deck.gl/layers";
import {
  AlphaColor,
  colorStroke,
  hexToRgb,
  lineWidth,
  setColor,
} from "../lib/Utils";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ThemeContext from "./ThemeProvider";
import { BitmapLayer } from '@deck.gl/layers';
/*import {
  LightingEffect,
  AmbientLight,
  _SunLight as SunLight
} from '@deck.gl/core';*/

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
  const [layers, setLayers] = React.useState([] as Array<GeoJsonLayer>);
  const { theme } = useContext(ThemeContext);
  const [mapStyle, setMapStyle] = React.useState("");

  /*
  const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 0.5
  });
  const sunLight = new SunLight({
    color: [255, 255, 255],
    intensity: 2.0,
    timestamp: 0
  });
  // create lighting effect with light sources
  const lightingEffect = new LightingEffect({ambientLight, sunLight});
  */
  
  const tileLayer = new TileLayer({
    id: 'tile-layer',
    data: theme === "light" ? 'http://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png' : 'http://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    maxRequests: 20,  
    pickable: false,
    tileSize: 64,
    opacity: 1,
    //change z-value
    renderSubLayers: (props) => {
      const {
        bbox: {west, south, east, north}
        
        
      } = props.tile;
      return [
        new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        })
      ];
    }
  });

  //set mapStyle by theme
  useEffect(() => {
    setMapStyle(
      theme === "light"
        ? "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
    );
  }, [theme]);

  const globeView = new GlobeView({
    id: "globe",
    controller: true,
  });

  const sphere = new SolidPolygonLayer({
    id: 'background',
    data: [
      [[-180, 90], [0, 90], [180, 90], [180, -90], [0, -90], [-180, -90]]
    ],
    getPolygon: d => d,
    stroked: false,
    filled: true,
    getFillColor: [250, 250, 250], 
    opacity: 1,

       
  })

  useEffect(() => {
    setLayers(
      new GeoJsonLayer({
        data: data,
        pointRadiusMinPixels: 6,
        getLineColor: colorStroke,
        getFillColor: (object: PieceProps) =>
          AlphaColor({
            col: hexToRgb(setColor(object.properties.mapcolor)),
            alpha: founds.includes(object.properties.cartodb_id) ? 150 : 0,
          }),
        opacity: 1,
        pickable: true,
        lineWidthMinPixels: lineWidth,
        updateTriggers: {
          lineWidthMinPixels: lineWidth,
          getLineColor: colorStroke,
          getFillColor: (object: PieceProps) =>
            AlphaColor({
              col: hexToRgb(setColor(object.properties.mapcolor)),
              alpha: founds?.includes(object.properties.cartodb_id) ? 150 : 0,
            }),
        },
        onClick: (info: PieceEvent) => onClickMap(info),
        onHover: (info: PieceEvent) => onHoverMap(info),
      })
    );
  }, [data, founds, onClickMap, onHoverMap, viewState]);

  return !viewState.zoom || !data ? null : (
    <React.Fragment>
      <DeckGL
        views={globeView}
        width="100%"
        height="100%"
        initialViewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={true}
        layers={[ sphere, tileLayer, layers ]}
       // parameters={{ depthTest: false, blend: true }}
      ></DeckGL>
    </React.Fragment>
  );
}
export default DeckMap;
