import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import "./MapPuzzle.css";
import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store";

import MenuTop from "./components/MenuTop";
import DeckMap from "./components/DeckMap";
import ToolsPanel from "./components/ToolsPanel";
import YouWin from "./components/YouWin";
import { Jsondb, getWiki, copyViewState } from "./lib/Utils";
import AnimatedCursor from "./lib/AnimatedCursor";
import GameTime from "./lib/GameTime";
import ReactFullscreeen from "react-easyfullscreen";
import { Col, Row } from "react-bootstrap";
import { PieceProps, MapPuzzleProps } from "./lib/Interfaces";
import WikiInfo from "./components/WikiInfo";
import { ViewState } from "react-map-gl";
import LoadingDialog from "./components/LoadingDialog";
import { PuzzleService } from "./services/puzzleService";
import { Puzzle } from "./models/puzzleModel";

class MapPuzzle extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      puzzles: null,
      data: null,
      puzzleSelected: 0,
      puzzleSelectedData: null,
      lineWidth: 1,
      color: [255, 0, 0],
      colorStroke: [150, 150, 150],
      zoom: 2,
      pieceSelected: null,
      pieceSelectedData: null,
      pieceSelectedCentroid: null,
      pieces: new Array<PieceProps>(),
      founds: new Array<any>(),
      fails: 0,
      time: {},
      loading: true,
      height: 0,
      win: false,
      isMouseTooltipVisible: false,
      tooltipValue: "",
      YouWin: false,
      showWikiInfo: false,
      wikiInfoUrl: "",
    };
  }
  componentDidMount() {
    PuzzleService.getPuzzles().then((content: Puzzle[]) => {
      var puzzleSelected = 0;
      this.setState({ content: content });

      if (window.location.pathname) {
        this.state.content.forEach(function (
          value: MapPuzzleProps,
          index: number
        ) {
          if (value.url === window.location.search.substr(5)) {
            puzzleSelected = index;
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
    });
  }
  /* load game from db */
  loadGame(puzzleSelected: number) {
    PuzzleService.getPuzzle(puzzleSelected).then((puzzleData: Puzzle) => {
      this.setState({
        puzzleSelectedData: puzzleData,
        puzzleSelected: puzzleSelected,
      });

      let viewStateCopy: ViewState = copyViewState(
        this.state.puzzleSelectedData.view_state,
        this.state.viewState
      );

      this.setState({
        loading: true,
        zoom: viewStateCopy.zoom,
        viewState: viewStateCopy,
      });

      Jsondb(this.state.puzzleSelectedData.data).then((response) => {
        this.setState({
          puzzleSelected: puzzleSelected,
          pieces: response.features,
          data: response,
          loading: false,
        });
        this.checkGameStatus();
        //restore game status from coockie
        var cookieFounds = getCookie("founds" + puzzleSelected);
        if (cookieFounds) {
          this.setState({
            founds: cookieFounds.split(",").map((e: any) => parseInt(e)),
          });
        } else {
          this.setState({ founds: [] });
        }

        var cookieFails = getCookie("fails" + puzzleSelected);
        if (cookieFails) {
          this.setState({ fails: parseInt(cookieFails) });
        } else {
          this.setState({ fails: 0 });
        }

        var cookieSeconds = getCookie("seconds" + puzzleSelected);
        if (cookieSeconds) {
          GameTime.seconds = parseInt(cookieSeconds);
        } else {
          GameTime.seconds = 0;
        }

        setCookie("puzzleSelected", puzzleSelected.toString(), 2);
        this.checkGameStatus();
      });
    });
  }

  /* Check remains pieces and update game status */
  checkGameStatus() {
    if (
      parseInt(this.state.pieces.length) - parseInt(this.state.founds.length) <=
        0 &&
      parseInt(this.state.pieces.length) > 0
    ) {
      this.setState({ YouWin: true });
    } else {
      this.setState({ YouWin: false });
    }
  }

  componentDidUpdate() {
    if (this.state.height !== window.innerHeight)
      this.setState({ height: window.innerHeight });
  }
  /* Piece is selected on list */
  onPieceSelectedHandler = (val: any) => {
    if (this.state.pieceSelected !== val.target.parentNode.id) {
      this.setState({ pieceSelected: val.target.parentNode.id });
      this.state.pieces.forEach((piece: PieceProps) => {
        if (
          String(piece.properties.cartodb_id).trim() ===
          String(val.target.parentNode.id).trim()
        ) {
          this.setState({ pieceSelectedData: piece });
          this.findCustomCentroids(piece);
        }
      });
    } else {
      this.setState({ pieceSelected: null, pieceSelectedData: null });
    }
  };
  /* find the custom centroid of the piece from content.json */
  findCustomCentroids(piece: PieceProps) {
    let found = false;
    if (this.state.puzzleSelectedData.custom_centroids) {
      this.state.puzzleSelectedData.custom_centroids.forEach(
        (centroid: any) => {
          if (centroid.cartodb_id === piece.properties.cartodb_id) {
            this.setState({ pieceSelectedCentroid: centroid });
            found = true;
          }
        }
      );
    }
    if (!found) {
      this.setState({ pieceSelectedCentroid: null });
    }
  }

  onSelectMapHandler = (val: any) => {
    if (val.target.id) {
      this.setState({
        puzzleSelected: val.target.id,
        pieceSelectedData: null,
        pieceSelected: null,
      });

      this.loadGame(val.target.id);
    }
  };

  /* Reset the Game */
  onResetGameHandler = () => {
    this.onRefocusMapHandler();
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
  };
  onHoverMapHandler = (info: any) => {
    if (info.object) {
      if (this.state.founds.includes(info.object.properties.cartodb_id)) {
        this.setState({
          isMouseTooltipVisible: true,
          tooltipValue: info.object.properties.name,
        });
      } else {
        this.setState({ isMouseTooltipVisible: false, tooltipValue: "" });
      }
    } else {
      this.setState({ isMouseTooltipVisible: false, tooltipValue: "" });
    }
  };

  onViewStateChangeHandler = (viewState: any) => {
    this.setState({
      zoom: viewState.viewState.zoom,
      viewState: viewState.viewState,
    });
  };

  onRefocusMapHandler = () => {
    let viewStateCopy: ViewState = copyViewState(
      this.state.puzzleSelectedData.view_state,
      this.state.viewState
    );

    this.setState({
      zoom: viewStateCopy.zoom,
      viewState: viewStateCopy,
    });
  };

  onShowWikiInfoHandler = (val: any) => {
    this.setState({
      showWikiInfo: val,
      wikiInfoUrl: this.state.puzzleSelectedData.wiki,
    });
  };

  onClickMapHandler = (info: any) => {
    if (info.object && !this.state.pieceSelected) {
      //if the piece is found, show the wiki info on click
      if (this.state.founds.includes(info.object.properties.cartodb_id)) {
        let wiki_url = getWiki(
          info.object.properties.cartodb_id,
          info.object.properties.name,
          this.state.puzzleSelectedData
        );
        this.setState({
          showWikiInfo: true,
          wikiInfoUrl: wiki_url,
        });
      }
    }
    if (info && this.state.pieceSelected) {
      if (
        String(this.state.pieceSelectedData.properties.cartodb_id).trim() ===
        String(info.object.properties.cartodb_id).trim()
      ) {
        if (
          !this.state.founds.includes(
            this.state.pieceSelectedData.properties.cartodb_id
          )
        ) {
          this.setState((prevState: any) => ({
            founds: [
              ...prevState.founds,
              this.state.pieceSelectedData.properties.cartodb_id,
            ],
            pieceSelected: null,
            pieceSelectedData: null,
          }));
          this.checkGameStatus();
          setCookie(
            "founds" + this.state.puzzleSelected,
            this.state.founds.join(),
            2
          );
        }
      } else {
        this.setState({ fails: this.state.fails + 1 });
        setCookie("fails" + this.state.puzzleSelected, this.state.fails, 2);
      }
    }
  };

  render() {
    let YouWinScreen: any = null;
    if (this.state.YouWin) {
      YouWinScreen = !this.state.content ? null : (
        <YouWin
          pieces={this.state.pieces}
          founds={this.state.founds}
          fails={this.state.fails}
          onResetGame={this.onResetGameHandler}
          path={this.state.puzzleSelectedData.url}
          name={this.state.puzzleSelectedData.name}
        />
      );
    }
    return !this.state.puzzleSelectedData ? null : (
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <LoadingDialog show={this.state.loading} delay={1000} />
            <DeckMap
              lineWidth={this.state.lineWidth}
              color={this.state.color}
              colorStroke={this.state.colorStroke}
              colorHeight={this.state.colorHeight}
              piece={this.state.pieceSelected}
              onClickMap={this.onClickMapHandler}
              onHoverMap={this.onHoverMapHandler}
              onViewStateChange={this.onViewStateChangeHandler}
              viewState={this.state.viewState}
              founds={this.state.founds}
              data={this.state.data}
            />
            <MenuTop
              name="MapPuzzle.xyz"
              onSelectMap={this.onSelectMapHandler}
              content={this.state.content}
              onResetGame={this.onResetGameHandler}
              loading={this.state.loading}
              onFullScreen={() => onToggle()}
              onRefocus={this.onRefocusMapHandler}
              onShowWikiInfo={this.onShowWikiInfoHandler}
            />

            {YouWinScreen}
            <Container fluid style={{ paddingTop: 15 + "px" }}>
              <Row>
                <Col xs={8} md={4} lg={4} xl={3}>
                  <ToolsPanel
                    name={this.state.puzzleSelectedData.name}
                    puzzleSelected={this.state.puzzleSelected}
                    pieceSelected={this.state.pieceSelected}
                    onPieceSelected={this.onPieceSelectedHandler}
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
              color="#666"
              zoom={this.state.zoom}
              selected={this.state.pieceSelectedData}
              centroid={this.state.pieceSelectedCentroid}
              tooltip={this.state.tooltipValue}
            />
            <WikiInfo
              show={this.state.showWikiInfo}
              url={this.state.wikiInfoUrl}
              onHide={this.onShowWikiInfoHandler}
            />
          </div>
        )}
      </ReactFullscreeen>
    );
  }
}

export default MapPuzzle;
