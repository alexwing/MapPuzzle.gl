import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React, { Component } from "react";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store"

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
    colorStroke: [150, 150, 150],
    pieceSelected: null,
    pieceSelectedData: null,
    viewState: VIEW_STATES[0],
    pieces: [],
    founds: [],
    fails: 0,
    height: window.innerHeight
  }
  componentDidMount() {
    //   Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(ST_Transform(the_geom,3857)) as poly, ST_Extent(ST_Transform(the_geom,3857 )) as box FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>
    Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(the_geom) as poly, ST_Extent(the_geom) as box, mapcolor7 FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>

      this.setState({ pieces: response.rows })
    )

    //removeCookie("founds");
    var cookieFounds = getCookie("founds");
    if (cookieFounds)
      this.setState({ founds: cookieFounds.split(',').map((e) => parseInt(e)) })

      var cookieFails = getCookie("fails");
      if (cookieFails)
        this.setState({ fails:  parseInt(cookieFails) })      
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

  onClickMapHandler = (info) => {
    if (info && this.state.pieceSelected) {
      if (String(this.state.pieceSelectedData.cartodb_id).trim() === String(info.object.properties.cartodb_id).trim()) {
        if (!this.state.founds.includes(this.state.pieceSelectedData.cartodb_id)) {
          console.log("FOUND: " + info.object.properties.name);
          this.setState(prevState => ({
            founds: [...prevState.founds, this.state.pieceSelectedData.cartodb_id],
            pieceSelected: null,
            pieceSelectedData: null
          }));
          setCookie("founds", this.state.founds.join(), 2)
        }
      } else {
        this.setState({ fails: this.state.fails + 1 });
        setCookie("fails", this.state.fails, 2)
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
          onClickMap={this.onClickMapHandler}
          viewState={this.state.viewState}
          founds={this.state.founds}
          onDataLoaded={this.onDataLoadedHandler}
        />
        <MenuTop name="MapPuzzle.gl" onSelectMap={this.onSelectMapHandler} />
        <Container fluid style={{ paddingTop: 15 + 'px' }}>
          <Row>
            <Col xs={8} md={4} lg={4} xl={3} style={{ zIndex: "9999" }}>
              <ToolsPanel name="Countries"
                pieceSelected={this.state.pieceSelected} onPieceSelected={this.onPieceSelectedHandler}
                pieces={this.state.pieces}
                height={this.state.height}
                founds={this.state.founds}
                fails={this.state.fails}
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