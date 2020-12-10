import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React, { Component } from "react";
import DeckMap from './components/DeckMap';

import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store"
import GameTime from './lib/GameTime.js'
import { Querydb } from './components/Utils.js';


import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import MenuTop from './components/MenuTop';
import ToolsPanel from './components/ToolsPanel';
import YouWin from './components/YouWin';


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

  constructor() {
    super();
    this.state = {
      data:null,
      lineWidth: 1,
      color: [255, 0, 0],
      colorStroke: [150, 150, 150],
      pieceSelected: null,
      pieceSelectedData: null,
      viewState: VIEW_STATES[0],
      pieces: [],
      founds: [],
      fails: 0,
      time: {},
      height: 0,
      win:false
    }
  }
  componentDidMount() {
    //Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(ST_Transform(the_geom,3857)) as poly, ST_Extent(ST_Transform(the_geom,3857 )) as box FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>
    //Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(the_geom) as poly, ST_Extent(the_geom) as box, mapcolor7 FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5 GROUP BY cartodb_id ORDER BY name ").then(response =>
    //Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(the_geom_webmercator) as poly, CONCAT(ST_XMin(ST_Extent(the_geom_webmercator)), ' ', ST_YMin(ST_Extent(the_geom_webmercator)),' ',ST_Distance(CONCAT('SRID=3857;POINT(',ST_XMax(the_geom_webmercator),' 0)')::geometry,CONCAT('SRID=3857;POINT(',ST_XMin(the_geom_webmercator),' 0)')::geometry), ' ',ST_Distance(CONCAT('SRID=3857;POINT(0 ',ST_YMax(the_geom_webmercator),')')::geometry,CONCAT('SRID=3857;POINT(0 ',ST_YMin(the_geom_webmercator),')')::geometry)) as box, mapcolor7 FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5   GROUP BY cartodb_id ORDER BY name ").then(response =>
    //Querydb("SELECT cartodb_id, name, formal_en, ST_AsSVG(ST_Translate(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator))),-ST_Xmin(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator)))),-ST_YMax(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator)))))) as poly, CONCAT('0 0 ',(ST_XMax(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator))))-ST_XMin(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator))))), ' ',(ST_YMax(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator))))-ST_YMin(ST_GeometryN(the_geom_webmercator, generate_series(1, ST_NumGeometries(the_geom_webmercator)))))) as box, mapcolor7 FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5   GROUP BY cartodb_id ORDER BY name ").then(response =>
    
    //Querydb("SELECT *, ST_AsSVG(ST_Translate(the_geom_webmercator,-ST_Xmin(the_geom_webmercator),-ST_YMax(the_geom_webmercator))) as poly, CONCAT('0 0 ',ST_Distance(CONCAT('SRID=3857;POINT(',ST_XMin(the_geom_webmercator),' 0)')::geometry,CONCAT('SRID=3857;POINT(',ST_XMax(the_geom_webmercator),' 0)')::geometry), ' ',ST_Distance(CONCAT('SRID=3857;POINT(0 ',ST_YMin(the_geom_webmercator),')')::geometry,CONCAT('SRID=3857;POINT(0 ',ST_YMax(the_geom_webmercator),')')::geometry)) as box FROM public.ne_50m_admin_0_countries WHERE ST_Area(the_geom) > 0.5   GROUP BY cartodb_id ORDER BY name")
    Querydb("world_borders.geojson")
    .then(response =>{
      this.setState({ pieces: response.features , data:response})  
      this.checkGameStatus();    
     })


    //restore game status from coockie
    var cookieFounds = getCookie("founds");
    if (cookieFounds)
      this.setState({ founds: cookieFounds.split(',').map((e) => parseInt(e)) })

    var cookieFails = getCookie("fails");
    if (cookieFails)
      this.setState({ fails: parseInt(cookieFails) })

    var cookieSeconds = getCookie("seconds");
    if (cookieSeconds)
      GameTime.seconds = parseInt(cookieSeconds);

      this.checkGameStatus();
  }
  checkGameStatus() {

    console.log(parseInt(this.state.pieces.length) +"-"+ parseInt(this.state.founds.length));
    if (parseInt(this.state.pieces.length) - parseInt(this.state.founds.length) <=0 && parseInt(this.state.pieces.length)>0 ){
        this.setState({ YouWin: true })
    } 

  }

  componentDidUpdate() {
    if (this.state.height !== window.innerHeight)
      this.setState({ height: window.innerHeight })
  }

  onPieceSelectedHandler = (val) => {
    if (this.state.pieceSelected !== val.target.parentNode.id) {
      this.setState({ pieceSelected: val.target.parentNode.id })
      this.state.pieces.forEach(piece => {
        if (String(piece.properties.cartodb_id).trim() === String(val.target.parentNode.id).trim()) {
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

  onResetGameHandler = () => {
    console.log("Reset the Game");
    removeCookie("founds");
    removeCookie("fails");
    this.setState({
      pieceSelected: null,
      pieceSelectedData: null,
      founds: [],
      fails: 0,
      YouWin: false,
    });
    GameTime.seconds = 0;
  }


  onClickMapHandler = (info) => {
    if (info && this.state.pieceSelected) {
      if (String(this.state.pieceSelectedData.properties.cartodb_id).trim() === String(info.object.properties.cartodb_id).trim()) {
        if (!this.state.founds.includes(this.state.pieceSelectedData.properties.cartodb_id)) {
          console.log("FOUND: " + info.object.properties.name);
          this.setState(prevState => ({
            founds: [...prevState.founds, this.state.pieceSelectedData.properties.cartodb_id],
            pieceSelected: null,
            pieceSelectedData: null
          }));
          console.log(this.state.pieces.length +"-"+ this.state.founds.length);          
          this.checkGameStatus();                 
          setCookie("founds", this.state.founds.join(), 2)
        }
      } else {
        this.setState({ fails: this.state.fails + 1 });
        setCookie("fails", this.state.fails, 2)
      }
    }
  }

  render() {
    let AnimatedCursorValue;
    if (this.state.pieceSelected) {
      AnimatedCursorValue = <AnimatedCursor
        clickScale={0.95}
        color='#666'
        selected={this.state.pieceSelectedData}
      />;
    }


    let YouWinScreen;
    if (this.state.YouWin) {
      YouWinScreen = <YouWin
      pieces={this.state.pieces}
      founds={this.state.founds}
      fails={this.state.fails}
      onResetGame={this.onResetGameHandler}
      />    
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
          data={this.state.data}
          onDataLoaded={this.onDataLoadedHandler}        
        />
        <MenuTop
          name="MapPuzzle.gl" onSelectMap={this.onSelectMapHandler}
          onResetGame={this.onResetGameHandler}
        />
        {YouWinScreen}
        <Container fluid style={{ paddingTop: 15 + 'px' }}>
          <Row>
            <Col xs={8} md={4} lg={4} xl={3} >
              <ToolsPanel name="Countries"
                pieceSelected={this.state.pieceSelected} onPieceSelected={this.onPieceSelectedHandler}
                pieces={this.state.pieces}
                height={this.state.height}
                founds={this.state.founds}
                fails={this.state.fails}
                YouWin={this.state.YouWin}
              />
            </Col>
          </Row>
          {AnimatedCursorValue}
        </Container>
      </div>
    );
  }
}

export default Main;