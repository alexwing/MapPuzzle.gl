import React, { Component } from "react";

// @ts-ignore
import { GeoJsonLayer } from "@deck.gl/layers";
import { StaticMap } from "react-map-gl";
// @ts-ignore
import DeckGL from "@deck.gl/react";
import { AlphaColor, hexToRgb, setColor } from "../lib/Utils";
export default class DeckMap extends Component<any, any> {
  render() {
    const { onClickMap, onHoverMap, onViewStateChange } = this.props;

    const layers = [
      new GeoJsonLayer({
        data: this.props.data,
        pointRadiusMinPixels: 6,
        getLineColor: this.props.colorStroke,
        getFillColor: (object: any) =>
          AlphaColor(
            hexToRgb(setColor(object.properties.mapcolor)),
            this.props.founds.includes(object.properties.cartodb_id) ? 150 : 0
          ),
        opacity: 1,
        pickable: true,
        lineWidthMinPixels: this.props.lineWidth,
        updateTriggers: {
          lineWidthMinPixels: this.props.lineWidth,
          getLineColor: this.props.colorStroke,
          getFillColor: (object: any) =>
            AlphaColor(
              hexToRgb(setColor(object.properties.mapcolor)),
              this.props.founds?.includes(object.properties.cartodb_id)
                ? 150
                : 0
            ),
        },
        onClick: (info: any) => onClickMap(info),
        onHover: (info: any) => onHoverMap(info),
      }),
    ];
    return (
      <React.Fragment>
        <DeckGL
          width="100%"
          height="100%"
          initialViewState={this.props.viewState}
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
}
