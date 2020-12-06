import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React, { Component } from "react";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';

import MenuTop from './components/MenuTop';
import ToolsPanel from './components/ToolsPanel';
import DeckMap from './components/DeckMap';

import { Querydb } from './components/Utils.js';

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
    lineWidth: 1,
    color: [255, 0, 0],
    colorStroke: [150,150, 150],
    pieceSelected: null,
    pieceSelectedData: null,
    info: null,
    viewState: VIEW_STATES[0],
    pieces: [],
    founds: [],
    height: window.innerHeight
  }
  componentDidMount() {
    Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(the_geom) as poly, ST_Extent(the_geom) as box FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>
      this.setState({ pieces: response.rows })
    )
  }
  componentDidUpdate() {
    if (this.state.height !== window.innerHeight)
      this.setState({ height: window.innerHeight })
  }

  onPieceSelectedHandler = (val) => {
    if (this.state.pieceSelected !== val.target.parentNode.id) {
      this.setState({ pieceSelected: val.target.parentNode.id })
      this.state.pieces.forEach(piece => {
        if (String(piece.cartodb_id).trim() === String(val.target.parentNode.id).trim()) {
          this.setState({ pieceSelectedData: piece })
        }
      });
    } else {
      this.setState({ pieceSelected: null, pieceSelectedData: null })
    }
  }
  onSelectMapHandler = (val) => {
    console.log(val.target.id);

    switch (val.target.id) {
      default:
        this.setState({ viewState: VIEW_STATES[0], piece: null });
        break;
    }
  }

  onHoverInfoHandler = (info) => {

      if (info && this.state.pieceSelected) {
        console.log("FOUND FOUND" + this.state.founds);
        //console.log("NO FOUND "+this.state.pieceSelectedData.cartodb_id+"NO FOUND "+this.state.info.properties.cartodb_id);
        if (String(this.state.pieceSelectedData.cartodb_id).trim() === String(info.object.properties.cartodb_id).trim()) {

          if (!this.state.founds.includes(this.state.pieceSelectedData.cartodb_id)) {
            this.setState(prevState => ({
              founds: [...prevState.founds, this.state.pieceSelectedData.cartodb_id],
              pieceSelected: null,
              pieceSelectedData: null

            }));
          }
        }
      }
  }
  render() {
    let button;
    if (this.state.pieceSelected) {
      button = <AnimatedCursor
        clickScale={0.95}
        color='#666'
        selected={this.state.pieceSelectedData}
      />;
    } 
    return (
      <div>

        <DeckMap lineWidth={this.state.lineWidth}
          color={this.state.color}
          colorStroke={this.state.colorStroke}
          colorHeight={this.state.colorHeight}
          piece={this.state.pieceSelected}
          onHoverInfo={this.onHoverInfoHandler}
          viewState={this.state.viewState}
          pieces={this.state.pieces}
          founds={this.state.founds}
          onDataLoaded={this.onDataLoadedHandler}
        />
        <MenuTop name="MapPuzzle.gl" onSelectMap={this.onSelectMapHandler} />
        <Container fluid style={{ paddingTop: 15 + 'px' }}>
          <Row>
            <Col xs={8} md={4} lg={4} xl={3} style={{ zIndex: "9999" }}>
              <ToolsPanel name="Countries"
                pieceSelected={this.state.pieceSelected} onPieceSelected={this.onPieceSelectedHandler}
                info={this.state.info}
                pieces={this.state.pieces}
                height={this.state.height}
                founds={this.state.founds}
              />
            </Col>
          </Row>
        </Container>
        {button}
      </div>
    );
  }
}

export default Main;