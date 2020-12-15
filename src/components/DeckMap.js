import React, { Component } from 'react';
import {GeoJsonLayer} from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {AlphaColor,hexToRgb,setColor} from '../lib/Utils.js';
export default class DeckMap extends Component {

  render() {
    const {onClickMap,onHoverMap} = this.props;
    
      const layers = [ new GeoJsonLayer({
      data: this.props.data,
      pointRadiusMinPixels: 6,
      getLineColor: this.props.colorStroke,
      getFillColor: (object) =>  AlphaColor(hexToRgb(setColor(object.properties.mapcolor)),this.props.founds.includes(object.properties.cartodb_id)?150:0),
      opacity:1,
      pickable: true,
      lineWidthMinPixels: this.props.lineWidth,
      updateTriggers: {
        lineWidthMinPixels: this.props.lineWidth,
        getLineColor: this.props.colorStroke,
        getFillColor: (object) =>  AlphaColor(hexToRgb(setColor(object.properties.mapcolor)),this.props.founds.includes(object.properties.cartodb_id)? 150:110),
      },
      onClick: info => onClickMap(info),
      onHover: info => onHoverMap(info),
    })
  
  ];
    return <div>
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={this.props.viewState}
        controller={true}
        layers={[layers]}
      >    
        <StaticMap
          reuseMaps
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json"
          preventStyleDiffing
        />
      </DeckGL>
    </div>
  }

}