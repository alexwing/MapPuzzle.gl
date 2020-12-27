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
import AnimatedCursor from "./lib/AnimatedCursor.js"
import GameTime from './lib/GameTime.js'
import ReactFullscreeen from 'react-easyfullscreen';

class MapPuzzle extends Component {

  constructor() {
    super();
    this.state = {
      data: null,
      puzzleSelected: 0,
      lineWidth: 1,
      color: [255, 0, 0],
      colorStroke: [150, 150, 150],
      zoom: 2,
      pieceSelected: null,
      pieceSelectedData: null,
      pieces: [],
      founds: [],
      fails: 0,
      time: {},
      loading: true,
      height: 0,
      win: false,
      isMouseTooltipVisible: false,
      tooltipValue: "",
      YouWin: false,
    }
  }
  componentDidMount() {

    var puzzleSelected = 0;
    if (window.location.pathname) {
      //  console.log(window.location.search.substr(5));
      this.props.content.puzzles.forEach(function (value, index) {
        if (value.url === window.location.search.substr(5)) {
          //    console.log(value.url + "==" + window.location.pathname.substring(1));
          puzzleSelected = index
        }
      });
      if (!puzzleSelected) {
        puzzleSelected = getCookie("puzzleSelected");
      }
    } else {
      puzzleSelected = getCookie("puzzleSelected");
    }
    if (!puzzleSelected) {
      puzzleSelected = 0;
    }
    this.loadGame(puzzleSelected);
  }

  loadGame(puzzleSelected) {
    
    this.setState({ loading: true, zoom: this.props.content.puzzles[puzzleSelected].view_state.zoom });

   // setCookie("seconds" + puzzleSelected, GameTime.seconds, 2);
    Jsondb(this.props.content.puzzles[puzzleSelected].data)
      .then(response => {
        this.setState({ loading: false, puzzleSelected: puzzleSelected, pieces: response.features, data: response });
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
    } else {
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
    if (val.target.id){
      this.setState({ puzzleSelected: val.target.id, pieceSelectedData: null, pieceSelected: null });
   
      this.loadGame(val.target.id);
    }
  }

  onFullScreenHandler = (val) => {
    console.log("enable fullscreen");
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
  onHoverMapHandler = (info) => {
    if (info.object) {
      if (this.state.founds.includes(info.object.properties.cartodb_id)) {
        this.setState({ isMouseTooltipVisible: true, tooltipValue: info.object.properties.name });
        //  console.log("FOUND: " + info.object.properties.name);
      } else {
        this.setState({ isMouseTooltipVisible: false, tooltipValue: "" });
      }
    } else {
      this.setState({ isMouseTooltipVisible: false, tooltipValue: "" });
    }
  }


  onViewStateChangeHandler = (viewState) => {
    console.log( viewState.viewState.zoom );
    this.setState({ zoom: viewState.viewState.zoom })
  }

  onClickMapHandler = (info) => {
    console.log("FOUND: " );
    if (info && this.state.pieceSelected) {
      if (String(this.state.pieceSelectedData.properties.cartodb_id).trim() === String(info.object.properties.cartodb_id).trim()) {
        if (!this.state.founds.includes(this.state.pieceSelectedData.properties.cartodb_id)) {
          // console.log("FOUND: " + info.object.properties.name);
          this.setState(prevState => ({
            founds: [...prevState.founds, this.state.pieceSelectedData.properties.cartodb_id],
            pieceSelected: null,
            pieceSelectedData: null
          }));
          //console.log(this.state.pieces.length + "-" + this.state.founds.length);
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
    let YouWinScreen;

    if (this.state.YouWin) {
      YouWinScreen = <YouWin
        pieces={this.state.pieces}
        founds={this.state.founds}
        fails={this.state.fails}
        onResetGame={this.onResetGameHandler}
        path={this.props.content.puzzles[this.state.puzzleSelected].url}
        name={this.props.content.puzzles[this.state.puzzleSelected].name}
      />
    }
    return (
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <DeckMap lineWidth={this.state.lineWidth}
              color={this.state.color}
              colorStroke={this.state.colorStroke}
              colorHeight={this.state.colorHeight}
              piece={this.state.pieceSelected}
              onClickMap={this.onClickMapHandler}
              onHoverMap={this.onHoverMapHandler}
              onViewStateChange={this.onViewStateChangeHandler}
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
              onFullScreen={() => onToggle() }
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
            </Container>
            <AnimatedCursor
              clickScale={0.95}
              color='#666'
              zoom={this.state.zoom}
              selected={this.state.pieceSelectedData}
              tooltip={this.state.tooltipValue}
            />
          </div>
        )}
      </ReactFullscreeen>
    );
  }
}

export default MapPuzzle;