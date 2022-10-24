import React, { useEffect } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { StaticMap } from "react-map-gl";
import { AlphaColor, colorStroke, hexToRgb, lineWidth, setColor } from "../lib/Utils";


function DeckMap({
  onClickMap,
  onHoverMap,
  onViewStateChange,
  viewState,
  founds,
  data,
}: any): JSX.Element | null {
  const [layers, setLayers] = React.useState([] as any);

  useEffect(() => {
    if (viewState) {
      setLayers(
        new GeoJsonLayer({
          data: data,
          pointRadiusMinPixels: 6,
          getLineColor: colorStroke,
          getFillColor: (object: any) =>
            AlphaColor(
              hexToRgb(setColor(object.properties.mapcolor)),
              founds.includes(object.properties.cartodb_id) ? 150 : 0
            ),
          opacity: 1,
          pickable: true,
          lineWidthMinPixels: lineWidth,
          updateTriggers: {
            lineWidthMinPixels: lineWidth,
            getLineColor: colorStroke,
            getFillColor: (object: any) =>
              AlphaColor(
                hexToRgb(setColor(object.properties.mapcolor)),
                founds?.includes(object.properties.cartodb_id) ? 150 : 0
              ),
          },
          onClick: (info: any) => onClickMap(info),
          onHover: (info: any) => onHoverMap(info),
        })
      );
    }
  }, [data, founds, lineWidth, onClickMap, onHoverMap, viewState]);

  return !viewState ? null : (
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
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json"
          preventStyleDiffing
        />
      </DeckGL>
    </React.Fragment>
  );
}
export default DeckMap;
