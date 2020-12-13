import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import './MapPuzzle.css';

import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store"

import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import MenuTop from './components/MenuTop';
import DeckMap from './components/DeckMap';
import ToolsPanel from './components/ToolsPanel';
import YouWin from './components/YouWin';
import { Jsondb } from './lib/Utils.js';
import AnimatedCursor from "./lib"
import GameTime from './lib/GameTime.js'


class MapPuzzle extends Component {

  constructor() {
    super();
    this.state = {
      data: null,
      puzzleSelected: 0,
      lineWidth: 1,
      color: [255, 0, 0],
      colorStroke: [150, 150, 150],
      pieceSelected: null,
      pieceSelectedData: null,
      pieces: [],
      founds: [],
      fails: 0,
      time: {},
      loading: true,
      height: 0,
      win: false
    }
  }
  componentDidMount() {
    var puzzleSelected = getCookie("puzzleSelected");
    if (puzzleSelected)
      this.loadGame(puzzleSelected);
    else
      this.loadGame(this.state.puzzleSelected);
  }

  loadGame(puzzleSelected) {
    this.setState({ loading: true });
    setCookie("seconds"+this.state.puzzleSelected, GameTime.seconds, 2);
    Jsondb(this.props.content.puzzles[puzzleSelected].data)
      .then(response => {
        this.setState({ loading:false,puzzleSelected: puzzleSelected, pieces: response.features, data: response });
        this.checkGameStatus();
        //restore game status from coockie
        var cookieFounds = getCookie("founds" + puzzleSelected);
        if (cookieFounds) {
          this.setState({ founds: cookieFounds.split(',').map((e) => parseInt(e)) })
        } else {
          this.setState({ founds: [] })
        }

        var cookieFails = getCookie("fails" + puzzleSelected);
        if (cookieFails) {
          this.setState({ fails: parseInt(cookieFails) })
        } else {
          this.setState({ fails: 0 })
        }

        var cookieSeconds = getCookie("seconds" + puzzleSelected);
        if (cookieSeconds) {
          GameTime.seconds = parseInt(cookieSeconds);
        } else {
          GameTime.seconds = 0;
        }

        setCookie("puzzleSelected", puzzleSelected, 2)
        this.checkGameStatus();
      })


  }

  checkGameStatus() {
    //console.log(parseInt(this.state.pieces.length) + "-" + parseInt(this.state.founds.length));
    if (parseInt(this.state.pieces.length) - parseInt(this.state.founds.length) <= 0 && parseInt(this.state.pieces.length) > 0) {
      this.setState({ YouWin: true });
    }else{
      this.setState({ YouWin: false });
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
    this.setState({ puzzleSelected: val.target.id, pieceSelectedData: null, pieceSelected: null });
    this.loadGame(val.target.id);
  }

  onResetGameHandler = () => {
    console.log("Reset the Game");
    removeCookie("founds" + this.state.puzzleSelected);
    removeCookie("fails" + this.state.puzzleSelected);
    removeCookie("seconds" + this.state.puzzleSelected);
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
          console.log(this.state.pieces.length + "-" + this.state.founds.length);
          this.checkGameStatus();
          setCookie("founds" + this.state.puzzleSelected, this.state.founds.join(), 2)
        }
      } else {
        this.setState({ fails: this.state.fails + 1 });
        setCookie("fails" + this.state.puzzleSelected, this.state.fails, 2)
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
          viewState={this.props.content.puzzles[this.state.puzzleSelected].view_state}
          founds={this.state.founds}
          data={this.state.data}
          onDataLoaded={this.onDataLoadedHandler}
        />
        <MenuTop
          name="MapPuzzle.xyz" onSelectMap={this.onSelectMapHandler}
          content={this.props.content.puzzles}
          onResetGame={this.onResetGameHandler}
          loading={this.state.loading}
        />
        {YouWinScreen}
        <Container fluid style={{ paddingTop: 15 + 'px' }}>
          <Row>
            <Col xs={8} md={4} lg={4} xl={3} >
              <ToolsPanel name={this.props.content.puzzles[this.state.puzzleSelected].name}
                puzzleSelected={this.state.puzzleSelected}
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

export default MapPuzzle;