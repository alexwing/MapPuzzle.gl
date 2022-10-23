/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import "./MapPuzzle.css";
import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store";

import MenuTop from "./components/MenuTop/MenuTop";
import DeckMap from "./components/DeckMap";
import ToolsPanel from "./components/ToolsPanel";
import YouWin from "./components/YouWin";
import { Jsondb, getWiki, copyViewState } from "./lib/Utils";
import AnimatedCursor from "./lib/AnimatedCursor";
import GameTime from "./lib/GameTime";
import ReactFullscreeen from "react-easyfullscreen";
import { Col, Row } from "react-bootstrap";
import { PieceProps } from "./models/Interfaces";
import WikiInfo from "./components/WikiInfo";
import { ViewState } from "react-map-gl";
import LoadingDialog from "./components/LoadingDialog";
import { PuzzleService } from "./services/puzzleService";
import { ConfigService } from "./services/configService";
import EditorDialog from "./editor/editorDialog";
import Puzzles from "../backend/src/models/puzzles";
import CustomCentroids from "../backend/src/models/customCentroids";
import CustomWiki from "../backend/src/models/customWiki";
import CustomTranslations from "../backend/src/models/customTranslations";

class MapPuzzle extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      puzzles: null,
      data: null,
      puzzleSelected: 1,
      puzzleSelectedData: null,
      puzzleCustomCentroids: null,
      puzzleCustomWiki: null,
      lineWidth: 1,
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
      winner: false,
      isMouseTooltipVisible: false,
      tooltipValue: "",
      showWikiInfo: false,
      wikiInfoUrl: "",
      wikiInfoId: -1,
      viewState: null,
    };
  }
  componentDidMount(): void {
    PuzzleService.getPuzzles().then((content: Puzzles[]) => {
      let puzzleSelected = 1;

      if (window.location.pathname) {
        content.forEach(function (value: Puzzles) {
          if (value.url === window.location.search.substring(5)) {
            puzzleSelected = value.id;
          }
        });
        if (!puzzleSelected) {
          puzzleSelected = getCookie("puzzleSelected");
        }
      } else {
        puzzleSelected = getCookie("puzzleSelected");
      }
      if (!puzzleSelected) {
        puzzleSelected = 1;
      }
      this.loadGame(puzzleSelected);
    });
  }
  /* load game from db */
  loadGame(puzzleSelected: number): void {
    this.setState({
      loading: true,
    });
    //get puzzle data from db
    PuzzleService.getPuzzle(puzzleSelected).then((puzzleData: any) => {
      //get map data from geojson
      Jsondb(puzzleData.data).then((response) => {
        this.getCustomCentroids(puzzleData.id);
        this.getCustomWikis(puzzleData.id);

        //// change path  route to "./?map=" + puzzleData.url
        window.history.pushState(
          {},
          puzzleData.name,
          "./?map=" + puzzleData.url
        );
        //change title
        document.title = "MapPuzzle.xyz - " + puzzleData.name;

        const viewStateCopy: ViewState = copyViewState(
          puzzleData.view_state,
          this.state.viewState
        );
        const pieces: PieceProps[] = response.features;

        //set name to pieces from pieces.properties.name
        pieces.forEach((piece: PieceProps) => {
          piece.name = piece.properties.name;
        });

        this.setState({
          puzzleSelectedData: puzzleData,
          puzzleSelected: puzzleSelected,
          zoom: viewStateCopy.zoom,
          viewState: viewStateCopy,
          pieces: pieces,
          data: response,
          loading: false,
        });
        //restore game status from coockie
        const cookieFounds = getCookie("founds" + puzzleSelected);
        if (cookieFounds) {
          this.setState({
            founds: cookieFounds.split(",").map((e: any) => parseInt(e)),
          });
        } else {
          this.setState({ founds: [] });
        }

        const cookieFails = getCookie("fails" + puzzleSelected);
        if (cookieFails) {
          this.setState({ fails: parseInt(cookieFails) });
        } else {
          this.setState({ fails: 0 });
        }

        const cookieSeconds = getCookie("seconds" + puzzleSelected);
        if (cookieSeconds) {
          GameTime.seconds = parseInt(cookieSeconds);
        } else {
          GameTime.seconds = 0;
        }

        setCookie(
          "puzzleSelected",
          puzzleSelected.toString(),
          ConfigService.cookieDays
        );
        this.checkGameStatus();
        this.onLangChangeHandler(getCookie("puzzleLanguage") || "en");
      });
    });
  }

  onLangChangeHandler = (lang: string) => {
    this.setState({
      lang: lang,
    });
    PuzzleService.getCustomTranslations(this.state.puzzleSelected, lang).then(
      (customTranslations: CustomTranslations[]) => {
        const pieces = this.state.pieces;
        pieces.forEach((piece: PieceProps) => {
          //find from CustomTranslations[]
          const customTranslation = customTranslations.find(
            (e: CustomTranslations) =>
              e.cartodb_id === piece.properties.cartodb_id && e.lang === lang
          )?.translation;
          if (customTranslation) {
            piece.properties.name = customTranslation;
          } else {
            piece.properties.name = piece.name;
          }
        });
        //sort pieces by name
        pieces.sort((a: PieceProps, b: PieceProps) => {
          if (a.properties.name < b.properties.name) {
            return -1;
          }
          if (a.properties.name > b.properties.name) {
            return 1;
          }
          return 0;
        });
        this.setState({ pieces: pieces });
      }
    );
  };

  private getCustomCentroids(id: number) {
    PuzzleService.getCustomCentroids(id).then(
      (customCentroids: CustomCentroids[]) => {
        this.setState({
          puzzleCustomCentroids: customCentroids,
        });
      }
    );
  }

  private getCustomWikis(id: number) {
    PuzzleService.getCustomWikis(id).then((customWiki: CustomWiki[]) => {
      this.setState({
        puzzleCustomWiki: customWiki,
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
      this.setState({ winner: true });
    } else {
      this.setState({ winner: false });
    }
  }

  componentDidUpdate() {
    if (this.state.height !== window.innerHeight)
      this.setState({ height: window.innerHeight });
  }
  /* Piece is selected on list */
  onPieceSelectedHandler = (val: any) => {
    this.selectPiece(val.target.parentNode.id);
  };

  selectPiece = (pieceId: number) => {
    if (this.state.pieceSelected !== pieceId) {
      this.setState({ pieceSelected: pieceId });
      this.state.pieces.forEach((piece: PieceProps) => {
        if (
          String(piece.properties.cartodb_id).trim() === String(pieceId).trim()
        ) {
          this.setState({ pieceSelectedData: piece });
          this.findCustomCentroids(piece);
        }
      });
    } else {
      this.setState({ pieceSelected: null, pieceSelectedData: null });
    }
  };

  /* handleUp on pieceList */
  //find previous piece from pieces list and select it
  onPieceUpHandler = () => {
    //finde pieces withou founds
    const pieces = this.state.pieces.filter(
      (e: PieceProps) => !this.state.founds.includes(e.properties.cartodb_id)
    );
    //find selected piece index
    const pieceIndex = pieces.findIndex(
      (e: PieceProps) =>
        e.properties.cartodb_id === parseInt(this.state.pieceSelected)
    );
    //find previous piece index
    if (pieceIndex > 0) {
      this.selectPiece(pieces[pieceIndex - 1].properties.cartodb_id);
    }
  };

  /* handleDown on pieceList */
  //find next piece from pieces list and select it
  onPieceDownHandler = () => {
    //finde pieces withou founds
    const pieces = this.state.pieces.filter(
      (e: PieceProps) => !this.state.founds.includes(e.properties.cartodb_id)
    );
    //find selected piece index
    const pieceIndex = pieces.findIndex(
      (e: PieceProps) =>
        e.properties.cartodb_id === parseInt(this.state.pieceSelected)
    );
    //find next piece index
    if (pieceIndex < pieces.length - 1) {
      this.selectPiece(pieces[pieceIndex + 1].properties.cartodb_id);
    }
  };

  /* find the custom centroid of the piece from content.json */
  findCustomCentroids(piece: PieceProps) {
    let found = false;
    if (this.state.puzzleCustomCentroids) {
      this.state.puzzleCustomCentroids.forEach((centroid: any) => {
        if (centroid.cartodb_id === piece.properties.cartodb_id) {
          this.setState({ pieceSelectedCentroid: centroid });
          found = true;
        }
      });
    }
    if (!found) {
      this.setState({ pieceSelectedCentroid: null });
    }
  }

  onSelectMapHandler = (val: number) => {
    if (val) {
      this.setState({
        puzzleSelected: val,
        pieceSelectedData: null,
        pieceSelected: null,
      });

      this.loadGame(val);
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
      winner: false,
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
    const viewStateCopy: ViewState = copyViewState(
      this.state.puzzleSelectedData.view_state,
      this.state.viewState
    );

    this.setState({
      zoom: viewStateCopy.zoom,
      viewState: viewStateCopy,
    });
  };

  onShowWikiInfoHandler = (val: any) => {
    if (val) {
      this.setState({
        showWikiInfo: true,
        wikiInfoUrl: this.state.puzzleSelectedData.wiki,
        wikiInfoId: this.state.puzzleSelectedData.id,
      });
    } else {
      this.setState({
        showWikiInfo: false,
        wikiInfoUrl: "",
        wikiInfoId: -1,
      });
    }
  };

  onShowEditorHandler = (val: any) => {
    if (val) {
      this.setState({
        showEditor: true,
      });
    } else {
      this.setState({
        showEditor: false,
      });
    }
  };

  onClickMapHandler = (info: any) => {
    if (info.object && !this.state.pieceSelected) {
      //if the piece is found, show the wiki info on click
      if (this.state.founds.includes(info.object.properties.cartodb_id)) {
        const wiki_url = getWiki(
          info.object.properties.cartodb_id,
          info.object.name,
          this.state.puzzleCustomWiki
        );
        this.setState({
          showWikiInfo: true,
          wikiInfoUrl: wiki_url,
          wikiInfoId: info.object.properties.cartodb_id,
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
            ConfigService.cookieDays
          );
        }
      } else {
        this.setState({ fails: this.state.fails + 1 });
        setCookie(
          "fails" + this.state.puzzleSelected,
          this.state.fails,
          ConfigService.cookieDays
        );
      }
    }
  };

  render() {
    return (
      <React.Fragment>
        <ReactFullscreeen>
          {({ onToggle }) => (
            <div>
              <LoadingDialog show={this.state.loading} delay={1000} />
              <DeckMap
                lineWidth={this.state.lineWidth}
                colorStroke={this.state.colorStroke}
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
                onResetGame={this.onResetGameHandler}
                onFullScreen={() => onToggle()}
                onRefocus={this.onRefocusMapHandler}
                onShowWikiInfo={this.onShowWikiInfoHandler}
                onShowEditor={this.onShowEditorHandler}
                onLangChange={this.onLangChangeHandler}
              />
              <YouWin
                winner={this.state.winner}
                founds={this.state.founds}
                fails={this.state.fails}
                onResetGame={this.onResetGameHandler}
                path={this.state.puzzleSelectedData?.url}
                name={this.state.puzzleSelectedData?.name}
              />
              <Container fluid style={{ paddingTop: 15 + "px" }}>
                <Row>
                  <Col xs={8} md={4} lg={4} xl={3}>
                    <ToolsPanel
                      name={this.state.puzzleSelectedData?.name}
                      puzzleSelected={this.state.puzzleSelected}
                      pieceSelected={this.state.pieceSelected}
                      onPieceSelected={this.onPieceSelectedHandler}
                      handleUp={this.onPieceUpHandler}
                      handleDown={this.onPieceDownHandler}
                      pieces={this.state.pieces}
                      height={this.state.height}
                      founds={this.state.founds}
                      fails={this.state.fails}
                      winner={this.state.winner}
                      lang={this.state.lang}
                      loading={this.state.loading}
                    />
                  </Col>
                </Row>
              </Container>
              <AnimatedCursor
                clickScale={0.95}
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
              <EditorDialog
                show={this.state.showEditor}
                onHide={this.onShowEditorHandler}
                puzzleSelected={this.state.puzzleSelectedData}
                pieces={this.state.pieces}
              />
            </div>
          )}
        </ReactFullscreeen>
      </React.Fragment>
    );
  }
}

export default MapPuzzle;
