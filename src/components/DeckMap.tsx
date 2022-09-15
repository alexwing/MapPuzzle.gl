import React, { useEffect } from "react";
// @ts-ignore
import { GeoJsonLayer } from "@deck.gl/layers";
import { StaticMap } from "react-map-gl";
// @ts-ignore
import DeckGL from "@deck.gl/react";
import { AlphaColor, hexToRgb, setColor } from "../lib/Utils";

function DeckMap({
  lineWidth,
  colorStroke,
  onClickMap,
  onHoverMap,
  onViewStateChange,
  viewState,
  founds,
  data,
}: any) {
  const [layers, setLayers] = React.useState([] as any);

  useEffect(() => {
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
        }
      )
    );
  }, [data, founds, lineWidth, colorStroke, onClickMap, onHoverMap]);
  
  return (
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
