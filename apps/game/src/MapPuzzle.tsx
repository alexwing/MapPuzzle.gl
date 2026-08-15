import React, { useCallback, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import "./styles/MapPuzzle.css";
import "./styles/icons.css";
import "./styles/responsive.css";
import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store";

import MenuTop from "./components/MenuTop/MenuTop";
import DeckMap from "./components/DeckMap";
import ToolsPanel from "./components/ToolsPanel";
import YouWin from "./components/YouWin";
import { Jsondb, getWiki, copyViewState, getLang, getTranslation, languageFromLocation, puzzleFromLocation, puzzlePath } from "./lib/Utils";
import AnimatedCursor from "./lib/AnimatedCursor";
import { useCanRotate } from "./lib/hooks/useCanRotate";
import { LinearInterpolator } from "@deck.gl/core";
import GameTime from "./lib/GameTime";
import ReactFullscreeen from "react-easyfullscreen";
import { Col, Row } from "react-bootstrap";
import { PieceEvent, PieceProps, ViewStateEvent } from "./models/Interfaces";
import WikiInfo from "./components/WikiInfo";
import { ViewState } from "react-map-gl";
import { LoadingDialog } from "@mappuzzle/core";
import { PuzzleService } from "@mappuzzle/core";
import { ConfigService } from "@mappuzzle/core";
import type { CustomCentroids } from "@mappuzzle/shared";
import type { CustomWiki } from "@mappuzzle/shared";
import type { CustomTranslations } from "@mappuzzle/shared";
import type { Puzzles } from "@mappuzzle/shared";
import { useTranslation } from "react-i18next";
import Donate from "./components/Donate";

/**
 * How far over the map leans in its tilted view. The same 45° Google Maps uses,
 * and about as far as it can go while a piece stays a shape you can recognise:
 * the dragged silhouette keeps 63% of its height there, against 50% at 60°.
 */
const TILTED_PITCH = 45;
/** Long enough to read as a movement, short enough not to be a wait. */
const TILT_TRANSITION_MS = 600;

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
  const [wikiInfoUrl, setWikiInfoUrl] = useState("");
  const [wikiInfoId, setWikiInfoId] = useState(-1);
  /**
   * Two view states, and they are not the same thing.
   *
   * `viewState` is what the app *asks* the map to do — the puzzle's framing on
   * load, the refocus, the tilt toggle. It goes in as initialViewState, so it
   * only ever changes when there is something to command.
   *
   * `liveView` is what the map *reports back*, every frame of every pan, zoom
   * and animation. The cursor piece needs it to stay square with the map.
   *
   * They used to be one, and every reported frame went straight back in as
   * initialViewState. deck tolerates that only while the echo still matches
   * the frame it is playing; let one React commit land late — and a 600 ms
   * animation is some thirty-six renders of this whole tree — and deck no
   * longer recognises the value coming back, sees no transition props on it,
   * and cancels. The map stops half-tilted and stays there, with no error.
   */
  const [viewState, setViewState] = useState({} as ViewState);
  const [liveView, setLiveView] = useState({} as ViewState);
  const [lang, setLang] = useState("");
  const { t, i18n } = useTranslation();
  const canRotate = useCanRotate();
  const tilted = (liveView?.pitch ?? 0) > 0;

  /*
  * Load the game on start
  */
  useEffect(() => {
    // An address with no puzzle in it — "/", "/?flagQuiz", "/flag-quiz/" —
    // opens the default one, as it always did.
    const asked = puzzleFromLocation();
    if (asked?.slug) {
      PuzzleService.getPuzzleIdByUrl(asked.slug).then((content: number) => {
        loadGame(content);
      });
    } else {
      loadGame(1);
    }
  }, []);

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
    setHeight(heightAux);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  /* 
  * load game from db 
  * @param puzzleId 
  * @returns void
  * @remarks Load the game from db and set the pieces and founds
  */
  const loadGame = (puzzleId: number) => {
    // An address in a language wins over the cookie: someone sent
    // /es/map/... asked for Spanish, whatever this browser last chose.
    const langAux = languageFromLocation() ?? getLang();
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
        // The canonical address, the one the prerendered page declares.
        window.history.pushState(
          {},
          puzzleData.name,
          // Keep the language the address came in: picking another puzzle from
          // /es/ should not silently drop you back into English.
          puzzlePath(puzzleData.url, false, languageFromLocation() ?? undefined)
        );
        //change title
        // The interface carries all seventy names in each language; without
        // this the Spanish page's title reverted to English the moment the app
        // booted, undoing what the prerendered page had said.
        document.title =
          "MapPuzzle.xyz - " +
          getTranslation("puzzles", String(puzzleData.id), puzzleData.name);

        if (
          puzzleData.view_state !== null &&
          puzzleData.view_state !== undefined
        ) {
          const viewStateCopy: ViewState = copyViewState(puzzleData.view_state);
          const piecesAux: PieceProps[] = response.features;
          //set name to pieces from pieces.properties.name
          piecesAux.forEach((piece: PieceProps) => {
            piece.name = piece.properties.name;
          });

          setPuzzleSelectedData(puzzleData);
          setPuzzleSelected(puzzleId);
          commandView(viewStateCopy);
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

  const onClickMapHandler = useCallback((info: PieceEvent) => {
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
  }, [founds, fails, pieceSelected, pieceSelectedData, puzzleCustomWiki, puzzleSelected, puzzleSelectedData]);

  const onHoverMapHandler = useCallback((info: PieceEvent) => {
    if (info.object) {
      if (founds.includes(info.object.properties.cartodb_id)) {
        setTooltipValue(info.object.properties.name);
      } else {
        setTooltipValue("");
      }
    } else {
      setTooltipValue("");
    }
  }, [founds]);

  /**
   * Every change to the view arrives here, whoever caused it, which makes it
   * the one place worth guarding. Where the screen is too small to turn the
   * map, the turn and the tilt are flattened on the way through and the
   * flattened state is returned, which is the value deck adopts.
   *
   * The controller already refuses those gestures, but deck.gl 8.9.36 has no
   * bearing constraint at all, so this is what actually holds it at north.
   */
  /**
   * Commands the map somewhere, at once, and keeps the live copy in step.
   *
   * deck reports a view change when it moves the map itself; adopting an
   * initialViewState it was handed is not one of those, so without this the
   * live copy would still describe where the map used to be, and the dragged
   * piece would go on leaning the way it leaned before the reset.
   *
   * Not for the tilt toggle: that one is animated, and deck reports every step
   * of it, starting with the first one before setProps has even returned.
   */
  const commandView = (next: ViewState) => {
    setViewState(next);
    setLiveView(next);
  };

  const onViewStateChangeHandler = useCallback((viewState: ViewStateEvent) => {
    const next = canRotate
      ? viewState.viewState
      : { ...viewState.viewState, bearing: 0, pitch: 0 };
    setLiveView(next);
    return next;
  }, [canRotate]);

  /**
   * Leaning the map over, and putting it back.
   *
   * Only the tilt: the turn is left where the player put it, since this is a
   * tilt control and not a compass. Refocus is what puts north back up.
   *
   * Animated the way the flag quiz already animates its flights — transition
   * props travel inside the view state — with a linear interpolator told to
   * compare the pitch alone, so the map leans over without also drifting or
   * zooming. Not FlyToInterpolator: that one always re-derives the position
   * and the zoom, which is the opposite of what is wanted here.
   *
   * Built from the live view, not from the last thing commanded: the player
   * has very likely panned since, and starting from a stale centre would drag
   * the map back there as it leaned.
   */
  const onToggleTiltHandler = () => {
    setViewState({
      ...liveView,
      pitch: tilted ? 0 : TILTED_PITCH,
      transitionDuration: TILT_TRANSITION_MS,
      // The object form rather than ["pitch"], which would also mark the pitch
      // "required" and assert on a view state that has not got one yet.
      transitionInterpolator: new LinearInterpolator({
        transitionProps: { compare: ["pitch"] },
      }),
    } as ViewState);
  };

  /**
   * A window can be dragged narrow, and a tablet can be a phone by turning it
   * sideways. Shutting the gestures off does not undo a tilt that is already
   * there — deck only re-applies its constraints when the canvas height
   * changes — so the map is laid flat here as the screen loses the right to
   * hold it up.
   *
   * Without an animation, and not for want of trying: the locked controller
   * carries maxPitch 0, and deck re-applies its constraints on every frame it
   * builds, so a pitch tween under it reports 0 from the very first step. It
   * snaps, and says so rather than pretending.
   */
  useEffect(() => {
    if (canRotate) return;
    if (!liveView?.zoom) return;
    if (!liveView.bearing && !liveView.pitch) return;
    commandView({ ...liveView, bearing: 0, pitch: 0 });
  }, [canRotate, liveView]);

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
        puzzleSelectedData.view_state
      );
      commandView(viewStateCopy);
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


  return (
    <React.Fragment>
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <LoadingDialog
              show={loading}
              delay={1000}
              title={t("common.loading")}
            />
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
              onToggleTilt={onToggleTiltHandler}
              canTilt={canRotate}
              tilted={tilted}
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
              zoom={liveView?.zoom}
              bearing={liveView?.bearing}
              pitch={liveView?.pitch}
              view={liveView}
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
            <Donate/>
          </div>
        )}
      </ReactFullscreeen>
    </React.Fragment>
  );
}

export default MapPuzzle;
