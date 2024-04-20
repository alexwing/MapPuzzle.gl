import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import "./styles/MapPuzzle.css";
import "./styles/icons.css";
import "./responsive.css";
import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store";

import MenuTop from "./components/MenuTop/MenuTop";
import DeckMap from "./components/DeckMap";
import ToolsPanel from "./components/ToolsPanel";
import YouWin from "./components/YouWin";
import { Jsondb, getWiki, copyViewState, getLang, cleanUrlParams } from "./lib/Utils";
import AnimatedCursor from "./lib/AnimatedCursor";
import GameTime from "./lib/GameTime";
import ReactFullscreeen from "react-easyfullscreen";
import { Col, Row } from "react-bootstrap";
import { PieceEvent, PieceProps, ViewStateEvent } from "./models/Interfaces";
import WikiInfo from "./components/WikiInfo";
import { ViewState } from "react-map-gl";
import LoadingDialog from "./components/LoadingDialog";
import { PuzzleService } from "./services/puzzleService";
import { ConfigService } from "./services/configService";
import EditorDialog from "./editor/editorDialog";
import CustomCentroids from "../backend/src/models/customCentroids";
import CustomWiki from "../backend/src/models/customWiki";
import CustomTranslations from "../backend/src/models/customTranslations";
import Puzzles from "../backend/src/models/puzzles";
import { useTranslation } from "react-i18next";
import Donate from "./components/Donate";

function MapPuzzle(): JSX.Element {
  const [data, setData] = useState({} as GeoJSON.FeatureCollection);
  const [puzzleSelected, setPuzzleSelected] = useState(1);
  const [puzzleSelectedData, setPuzzleSelectedData] = useState({} as Puzzles);
  const [puzzleCustomCentroids, setPuzzleCustomCentroids] = useState(
    [] as CustomCentroids[]
  );
  const [puzzleCustomWiki, setPuzzleCustomWiki] = useState([] as CustomWiki[]);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [pieceSelectedData, setPieceSelectedData] = useState({} as PieceProps);
  const [pieceSelectedCentroid, setPieceSelectedCentroid] = useState(
    {} as CustomCentroids
  );
  const [pieces, setPieces] = useState([] as Array<PieceProps>);
  const [founds, setFounds] = useState([] as Array<number>);
  const [fails, setFails] = useState(0);
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(0);
  const [winner, setWinner] = useState(false);
  const [tooltipValue, setTooltipValue] = useState("");
  const [showWikiInfo, setShowWikiInfo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [wikiInfoUrl, setWikiInfoUrl] = useState("");
  const [wikiInfoId, setWikiInfoId] = useState(-1);
  const [viewState, setViewState] = useState({} as ViewState);
  const [lang, setLang] = useState("");
  const { i18n } = useTranslation();

  /*
  * Load the game on start
  */
  useEffect(() => {
    if (window.location.pathname) {
      const puzzleUrl = cleanUrlParams(window.location.search.substring(5));
      PuzzleService.getPuzzleIdByUrl(puzzleUrl).then((content: number) => {
        loadGame(content);
      });
    } else {
      loadGame(1);
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [height]);
  
  /*
  * Handle resize of the window set the height of tools panel
  */
  const handleResize = () => {
    let heightAux = window.innerHeight;
    if (window.innerWidth < 992) {
      heightAux = window.innerHeight / 2;
    } else {
      heightAux = window.innerHeight;
    }
    if (height !== heightAux) {
      setHeight(heightAux);
    }
  };


  /* 
  * load game from db 
  * @param puzzleId 
  * @returns void
  * @remarks Load the game from db and set the pieces and founds
  */
  const loadGame = (puzzleId: number) => {
    const langAux = getLang();
    i18n.changeLanguage(langAux);
    setPieces([]);
    setFounds([]);
    setLang(langAux);
    setLoading(true);
    //get puzzle data from db
    PuzzleService.getPuzzle(puzzleId).then((puzzleData: Puzzles) => {
      //get map data from geojson
      Jsondb(puzzleData.data).then((response) => {
        getCustomCentroids(puzzleData.id);
        getCustomWikis(puzzleData.id);
        //// change path  route to "./?map=" + puzzleData.url
        window.history.pushState(
          {},
          puzzleData.name,
          "./?map=" + puzzleData.url
        );
        //change title
        document.title = "MapPuzzle.xyz - " + puzzleData.name;

        if (
          puzzleData.view_state !== null &&
          puzzleData.view_state !== undefined
        ) {
          const viewStateCopy: ViewState = copyViewState(
            puzzleData.view_state,
            viewState
          );
          const piecesAux: PieceProps[] = response.features;
          //set name to pieces from pieces.properties.name
          piecesAux.forEach((piece: PieceProps) => {
            piece.name = piece.properties.name;
          });

          setPuzzleSelectedData(puzzleData);
          setPuzzleSelected(puzzleId);
          setViewState(viewStateCopy);
          setData(response);

          loadPiecesByLang(puzzleId, piecesAux, langAux);
        }
      });
    });
  };

  /*
  * Restore cookies from game
  * @param puzzleId
  * @returns void
  */
  const restoreCookies = (puzzleId: number) => {
    const cookieFounds = getCookie("founds" + puzzleId);
    if (cookieFounds) {
      setFounds(cookieFounds.split(",").map(Number));
    } else {
      setFounds([]);
    }
    const cookieFails = getCookie("fails" + puzzleId);
    if (cookieFails) {
      setFails(parseInt(cookieFails));
    } else {
      setFails(0);
    }
    const cookieSeconds = getCookie("seconds" + puzzleId);
    if (cookieSeconds) {
      GameTime.seconds = parseInt(cookieSeconds);
    } else {
      GameTime.seconds = 0;
    }
  };

  /*
  * Load pieces by lang
  * @param puzzleSelectedAux
  * @param piecesAux
  * @param langAux
  * @returns void
  * @remarks Load the pieces from db and set the pieces and founds
  * */
  function loadPiecesByLang(
    puzzleSelectedAux: number,
    piecesAux: PieceProps[],
    langAux: string
  ) {
    //force refresh of pieces
    setPieces([]);
    PuzzleService.getCustomTranslations(puzzleSelectedAux, langAux).then(
      (customTranslations: CustomTranslations[]) => {
        piecesAux.forEach((piece: PieceProps) => {
          //find from CustomTranslations[]
          const customTranslation = customTranslations.find(
            (e: CustomTranslations) =>
              e.cartodb_id === piece.properties.cartodb_id && e.lang === langAux
          )?.translation;
          if (customTranslation) {
            piece.properties.name = customTranslation;
          } else {
            piece.properties.name = piece.name;
          }
        });
        //sort pieces by name
        piecesAux.sort((a: PieceProps, b: PieceProps) => {
          if (a.properties.name < b.properties.name) {
            return -1;
          }
          if (a.properties.name > b.properties.name) {
            return 1;
          }
          return 0;
        });
        setPieces(piecesAux);
        //restore game status from coockie
        restoreCookies(puzzleSelectedAux);
        setLoading(false);
      }
    );
  }

  useEffect(() => {
    loadPiecesByLang(puzzleSelected, pieces, lang);
  }, [lang]);

  const onLangChangeHandler = (lang: string) => {
    setLang(lang);
  };

  /* get custom centroids from db */
  const getCustomCentroids = (puzzleId: number) => {
    PuzzleService.getCustomCentroids(puzzleId).then(
      (customCentroids: CustomCentroids[]) => {
        setPuzzleCustomCentroids(customCentroids);
      }
    );
  };

  /* get custom wikis from db */
  const getCustomWikis = (puzzleId: number) => {
    PuzzleService.getCustomWikis(puzzleId).then((customWiki: CustomWiki[]) => {
      setPuzzleCustomWiki(customWiki);
    });
  };

  /* check if the game is finished */
  useEffect(() => {
    if (pieces.length - founds.length <= 0 && pieces.length > 0) {
      setWinner(true);
    } else {
      setWinner(false);
    }
  }, [founds]);

  const onClickMapHandler = (info: PieceEvent) => {
    if (info.object) {
      console.log("Selected piece: " + info.object.properties.cartodb_id);
      //if the piece is found and wiki is enabled in puzzle, show the wiki info on click
      if (
        founds.includes(info.object.properties.cartodb_id) &&
        puzzleSelectedData.enableWiki
      ) {
        const wiki_url = getWiki(
          info.object.properties.cartodb_id,
          info.object.name,
          puzzleCustomWiki
        );
        setShowWikiInfo(true);
        setWikiInfoUrl(wiki_url);
        setWikiInfoId(info.object.properties.cartodb_id);
        return;
      }
    }
    if (info && pieceSelected && pieceSelectedData?.properties?.cartodb_id) {
      if (
        String(pieceSelectedData.properties.cartodb_id).trim() ===
        String(info.object.properties.cartodb_id).trim()
      ) {
        if (!founds.includes(pieceSelectedData.properties.cartodb_id)) {
          const auxFounds = [
            ...founds,
            pieceSelectedData.properties.cartodb_id,
          ];
          setFounds(auxFounds);
          setPieceSelected(-1);
          setPieceSelectedData({} as PieceProps);
          setCookie(
            "founds" + puzzleSelected,
            auxFounds.join(),
            ConfigService.cookieDays
          );
        }
      } else {
        const auxFails = fails + 1;
        setFails(auxFails);
        setCookie(
          "fails" + puzzleSelected,
          auxFails.toString(),
          ConfigService.cookieDays
        );
      }
    }
  };

  const onHoverMapHandler = (info: PieceEvent) => {
    if (info.object) {
      if (founds.includes(info.object.properties.cartodb_id)) {
        setTooltipValue(info.object.properties.name);
      } else {
        setTooltipValue("");
      }
    } else {
      setTooltipValue("");
    }
  };

  const onViewStateChangeHandler = (viewState: ViewStateEvent) => {
    setViewState(viewState.viewState);
  };

  const onSelectMapHandler = (val: number) => {
    if (val) {
      setPuzzleSelected(val);
      setPieceSelectedData({} as PieceProps);
      setPieceSelected(-1);
      loadGame(val);
    }
  };

  /* Reset the Game */
  const onResetGameHandler = () => {
    onRefocusMapHandler();
    removeCookie("founds" + puzzleSelected);
    removeCookie("fails" + puzzleSelected);
    removeCookie("seconds" + puzzleSelected);
    setPieceSelected(-1);
    setPieceSelectedData({} as PieceProps);
    setFounds([]);
    setFails(0);
    setWinner(false);

    GameTime.seconds = 0;
  };

  const onRefocusMapHandler = () => {
    if (
      puzzleSelectedData.view_state !== null &&
      puzzleSelectedData.view_state !== undefined
    ) {
      const viewStateCopy: ViewState = copyViewState(
        puzzleSelectedData.view_state,
        viewState
      );
      setViewState(viewStateCopy);
    }
  };

  const onShowWikiInfoHandler = (val: boolean) => {
    if (
      val &&
      puzzleSelectedData !== null &&
      puzzleSelectedData !== undefined
    ) {
      setShowWikiInfo(true);
      setWikiInfoUrl(puzzleSelectedData.wiki ? puzzleSelectedData.wiki : "");
    } else {
      setShowWikiInfo(false);
      setWikiInfoUrl("");
    }
  };

  const onShowEditorHandler = (val: boolean) => {
    setShowEditor(val);
  };

  /* Piece is selected on list */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPieceSelectedHandler = (val: any) => {
    if (val?.target?.parentNode) {
      selectPiece(parseInt(val.target.parentNode.id));
    }
  };

  const selectPiece = (pieceId: number) => {
    if (pieceSelected !== pieceId) {
      setPieceSelected(pieceId);
      pieces.forEach((piece: PieceProps) => {
        if (
          String(piece.properties.cartodb_id).trim() === String(pieceId).trim()
        ) {
          setPieceSelectedData(piece);
          findCustomCentroids(piece);
        }
      });
    } else {
      setPieceSelected(-1);
      setPieceSelectedData({} as PieceProps);
    }
  };

  /* find the custom centroid of the piece from content.json */
  const findCustomCentroids = (piece: PieceProps) => {
    let found = false;
    if (puzzleCustomCentroids) {
      puzzleCustomCentroids.forEach((centroid: CustomCentroids) => {
        if (centroid.cartodb_id === piece.properties.cartodb_id) {
          setPieceSelectedCentroid(centroid);
          found = true;
        }
      });
    }
    if (!found) {
      setPieceSelectedCentroid({} as CustomCentroids);
    }
  };

  /* handleUp on pieceList */
  //find previous piece from pieces list and select it
  const onPieceUpHandler = () => {
    //finde pieces withou founds
    const piecesAux = pieces.filter(
      (e: PieceProps) => !founds.includes(e.properties.cartodb_id)
    );
    //find selected piece index
    const pieceIndex = piecesAux.findIndex(
      (e: PieceProps) => e.properties.cartodb_id === pieceSelected
    );
    //find previous piece index
    if (pieceIndex > 0) {
      selectPiece(piecesAux[pieceIndex - 1].properties.cartodb_id);
    }
  };

  /* handleDown on pieceList */
  //find next piece from pieces list and select it
  const onPieceDownHandler = () => {
    //finde pieces withou founds
    const piecesAux = pieces.filter(
      (e: PieceProps) => !founds.includes(e.properties.cartodb_id)
    );
    //find selected piece index
    const pieceIndex = piecesAux.findIndex(
      (e: PieceProps) => e.properties.cartodb_id === pieceSelected
    );
    //find next piece index
    if (pieceIndex < pieces.length - 1) {
      selectPiece(pieces[pieceIndex + 1].properties.cartodb_id);
    }
  };

  window.addEventListener('resize', handleResize)

  return (
    <React.Fragment>
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <LoadingDialog show={loading} delay={1000} />
            <DeckMap
              onClickMap={onClickMapHandler}
              onHoverMap={onHoverMapHandler}
              onViewStateChange={onViewStateChangeHandler}
              viewState={viewState}
              founds={founds}
              data={data}
            />
            <MenuTop
              name="MapPuzzle.xyz"
              onSelectMap={onSelectMapHandler}
              onResetGame={onResetGameHandler}
              onFullScreen={onToggle}
              onRefocus={onRefocusMapHandler}
              onShowEditor={onShowEditorHandler}
              onLangChange={onLangChangeHandler}
              puzzleSelected={puzzleSelected}
            />
            <YouWin
              winner={winner}
              founds={founds}
              fails={fails}
              onResetGame={onResetGameHandler}
              path={puzzleSelectedData?.url}
              name={puzzleSelectedData?.name}
            />
            <Container fluid style={{ paddingTop: 15 + "px" }}>
              <Row>
                <Col xs={12} md={8} lg={4} xl={3}>
                  <ToolsPanel
                    name={puzzleSelectedData?.name}
                    flag={puzzleSelectedData?.icon}
                    puzzleSelected={puzzleSelected}
                    pieceSelected={pieceSelected}
                    onPieceSelected={onPieceSelectedHandler}
                    handleUp={onPieceUpHandler}
                    handleDown={onPieceDownHandler}
                    pieces={pieces}
                    height={height}
                    founds={founds}
                    fails={fails}
                    winner={winner}
                    enableFlags={
                      puzzleSelectedData.enableFlags
                        ? puzzleSelectedData.enableFlags
                        : false
                    }
                    lang={lang}
                    loading={loading}
                  />
                </Col>
              </Row>
            </Container>
            <AnimatedCursor
              clickScale={0.95}
              zoom={viewState?.zoom}
              selected={pieceSelectedData}
              centroid={pieceSelectedCentroid}
              tooltip={tooltipValue}
            />
            <WikiInfo
              show={showWikiInfo}
              url={wikiInfoUrl}
              onHide={onShowWikiInfoHandler}
              piece={wikiInfoId}
              enableFlags={
                puzzleSelectedData.enableFlags
                  ? puzzleSelectedData.enableFlags
                  : false
              }
              puzzleSelected={puzzleSelected}
            />
            <EditorDialog
              show={showEditor}
              onHide={onShowEditorHandler}
              puzzleSelected={puzzleSelectedData}
              pieces={pieces}
            />
            <Donate/>
          </div>
        )}
      </ReactFullscreeen>
    </React.Fragment>
  );
}

export default MapPuzzle;
