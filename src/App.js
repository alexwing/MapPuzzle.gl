import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React, { Component } from "react";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';

import MenuTop from './components/MenuTop';
import ToolsPanel from './components/ToolsPanel';
import DeckMap from './components/DeckMap';

import {  Querydb } from './components/Utils.js';

import AnimatedCursor from "./lib"

const VIEW_STATES = [
  {
    longitude: 0,
    latitude: 0,
    zoom: 2,
    //pitch: 50,
    bearing: 0
  }
];

class Main extends Component {

  state = {
    lineWidth: 2,
    colorHeight: 14,
    color: [255, 0, 0],
    colorStroke: [0, 0, 0],
    pieceSelected: "All",
    info: null,
    viewState: VIEW_STATES[0],
    continents: [],
    height: window.innerHeight
  }
  componentDidMount() {
    Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(the_geom) as poly, ST_Extent(the_geom) as box FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>
      this.setState({ continents: response.rows }) 
    )
  }
  componentDidUpdate() {
    if (this.state.height !== window.innerHeight) 
      this.setState({ height: window.innerHeight })
  }


  onPieceSelectedHandler = (val) => {
    console.log (val.target.parentNode.id);
    if (this.state.pieceSelected !== val.target.parentNode.id) {
      this.setState({ pieceSelected: val.target.parentNode.id })
    } else {
      this.setState({ pieceSelected: "All" })
    }
  }
  onSelectMapHandler = (val) => {
    console.log(val.target.id);

    switch (val.target.id) {
      default:
        this.setState({ viewState: VIEW_STATES[0], continent: "All" });
        break;
    }
  }

  onHoverInfoHandler = (info) => {
    if (!info.object) {
      this.setState({ info: null })
      return;
    }
    else {
      this.setState({ info: info.object })
    }
  }

  render() {
    return (
      <div>
     
        <DeckMap lineWidth={this.state.lineWidth}
          color={this.state.color}
          colorStroke={this.state.colorStroke}
          colorHeight={this.state.colorHeight}
          continent={this.state.pieceSelected}
          onHoverInfo={this.onHoverInfoHandler}
          viewState={this.state.viewState}
          continents={this.state.continents}
          onDataLoaded={this.onDataLoadedHandler}
        />
        <MenuTop name="MapPuzzle.gl" onSelectMap={this.onSelectMapHandler} />
        <Container fluid style={{ paddingTop: 15 + 'px' }}>
          <Row>
            <Col xs={8} md={4} lg={4} xl={3}>
              <ToolsPanel name="Countries"
                pieceSelected={this.state.pieceSelected} onPieceSelected={this.onPieceSelectedHandler}
                info={this.state.info}
                continents={this.state.continents}
                height={this.state.height}
              />
            </Col>
          </Row>
        </Container>
        <AnimatedCursor 
            innerSize={0.4} 
            outerSize={0.4} 
            color='220, 90, 90' 
            outerAlpha = {0.4}
           
            
            />           
      </div>
    );
  }
}

export default Main;