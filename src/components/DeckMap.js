import React, { Component } from 'react';
import { CartoSQLLayer } from '@deck.gl/carto';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {AlphaColor,hexToRgb,setColor} from './Utils.js';

export default class DeckMap extends Component {

  render() {
    const {onClickMap} = this.props;
    /*function getpieceCondition(piece) {
      return piece !== 'All' ? `WHERE piece='${piece}'` : '';
    }*/
    const layers = [ 
    new CartoSQLLayer({
   //   data: `SELECT *, (pop_est* 100 / (SELECT SUM(pop_est) FROM public.ne_50m_admin_0_countries)) as percent FROM public.ne_50m_admin_0_countries ${getpieceCondition(this.props.piece)}`,
      data: `SELECT *, ST_AsSVG(the_geom) as poly  FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 `,
      pointRadiusMinPixels: 6,
      getLineColor: this.props.colorStroke,
      getFillColor: (object) =>  AlphaColor(hexToRgb(setColor(object.properties.mapcolor7)),this.props.founds.includes(object.properties.cartodb_id)?150:0),
      opacity:1,
      pickable: true,
      lineWidthMinPixels: this.props.lineWidth,
      updateTriggers: {
        lineWidthMinPixels: this.props.lineWidth,
        getLineColor: this.props.colorStroke,
        getFillColor: (object) =>  AlphaColor(hexToRgb(setColor(object.properties.mapcolor7)),this.props.founds.includes(object.properties.cartodb_id)? 150:0),
      },
      onClick: info => onClickMap(info)
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