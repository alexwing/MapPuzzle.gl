import React, { Component } from 'react';
import { CartoSQLLayer } from '@deck.gl/carto';

import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {LightenDarkenColor} from './Utils.js';

export default class DeckMap extends Component {

  render() {
    const {onHoverInfo,onDataLoaded,viewState } = this.props;
    /*function getpieceCondition(piece) {
      return piece !== 'All' ? `WHERE piece='${piece}'` : '';
    }*/
    const layers = [ 
    new CartoSQLLayer({
   //   data: `SELECT *, (pop_est* 100 / (SELECT SUM(pop_est) FROM public.ne_50m_admin_0_countries)) as percent FROM public.ne_50m_admin_0_countries ${getpieceCondition(this.props.piece)}`,
      data: `SELECT *, (pop_est* 100 / (SELECT SUM(pop_est) FROM public.ne_50m_admin_0_countries)) as percent, ST_AsSVG(the_geom) as poly  FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 `,
      pointRadiusMinPixels: 6,
      getLineColor: this.props.colorStroke,
      getFillColor: (object) => LightenDarkenColor(this.props.color,(object.properties.percent/ (this.props.colorHeight/10))),
      opacity: 0.8,
      pickable: true,
      lineWidthMinPixels: this.props.lineWidth,
      updateTriggers: {
        lineWidthMinPixels: this.props.lineWidth,
        getLineColor: this.props.colorStroke,
        getFillColor: (object) => LightenDarkenColor(this.props.color,(object.properties.percent/ (this.props.colorHeight/10)))
      },
      onHover: info => onHoverInfo(info)
     

    })
  
  ];
    return <div>
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={viewState}
        controller={true}
        //   effects= {postProcessEffect}
        layers={[layers]}
      >    
        <StaticMap
          reuseMaps
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          preventStyleDiffing
        />
      </DeckGL>
    </div>
  }

}