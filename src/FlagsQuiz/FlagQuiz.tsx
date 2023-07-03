import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import "./FlagQuiz.css";
import { setCookie, getCookie, removeCookie } from "react-simple-cookie-store";

import DeckMap from "../components/DeckMap";
import { FlyToInterpolator, ViewState } from "react-map-gl";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ReactFullscreeen from "react-easyfullscreen";
import MenuTop from "./MenuTop/MenuTop";
import Puzzles from "../../backend/src/models/puzzles";
import {
  getLang,
  Jsondb,
  shuffle,
  getWiki,
  cleanUrlParams,
  calculateZoom,
} from "../lib/Utils";
import GameTime from "../lib/GameTime";
import { PuzzleService } from "../services/puzzleService";
import { useTranslation } from "react-i18next";
import CustomTranslations from "../../backend/src/models/customTranslations";
import LoadingDialog from "../components/LoadingDialog";
import * as turf from "@turf/turf";
import PieceQuiz from "./Quiz/PieceQuiz";
import YouWin from "../components/YouWin";
import { ConfigService } from "../services/configService";
import Tooltip from "./lib/Tooltip";
import CustomWiki from "../../backend/src/models/customWiki";
import WikiInfo from "../components/WikiInfo";

function FlagQuiz(): JSX.Element {
  const [data, setData] = useState({} as GeoJSON.FeatureCollection);
  const [puzzleSelected, setPuzzleSelected] = useState(1);
  const [puzzleSelectedData, setPuzzleSelectedData] = useState({} as Puzzles);
  const [pieceSelectedData, setPieceSelectedData] = useState({} as PieceProps);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [pieces, setPieces] = useState([] as Array<PieceProps>);
  const [loading, setLoading] = useState(true);
  const [winner, setWinner] = useState(false);
  const [viewState, setViewState] = useState({} as ViewState);
  const [founds, setFounds] = useState([] as Array<number>);
  const [foundsIds, setFoundsIds] = useState([] as Array<number>);
  const [lang, setLang] = useState("");
  const { i18n } = useTranslation();
  const [fails, setFails] = useState([] as Array<number>);
  const [corrects, setCorrects] = useState([] as Array<number>);
  const [questions, setQuestions] = useState([] as Array<PieceProps>);
  const [reset, setReset] = useState(false);
  const [tooltipValue, setTooltipValue] = useState("");
  const [puzzleCustomWiki, setPuzzleCustomWiki] = useState([] as CustomWiki[]);
  const [showWikiInfo, setShowWikiInfo] = useState(false);
  const [wikiInfoUrl, setWikiInfoUrl] = useState("");
  const [wikiInfoId, setWikiInfoId] = useState(-1);
  const MIN_ZOOM = 2.5;
  const ZOOM_OUT_FACTOR = 0.8;

  const CORRECT_COLOR = 1;
  const WRONG_COLOR = 4;
  const SELECTED_COLOR = 0;

  const NUM_QUESTION = 6;

  useEffect(() => {
    if (window.location.pathname) {
      const puzzleUrl = cleanUrlParams(window.location.search.substring(10));
      PuzzleService.getPuzzleIdByUrl(puzzleUrl).then((content: number) => {
        loadGame(content);
      });
    } else {
      loadGame(1);
    }
  }, []);

  const getCustomWikis = (puzzleId: number) => {
    PuzzleService.getCustomWikis(puzzleId).then((customWiki: CustomWiki[]) => {
      setPuzzleCustomWiki(customWiki);
    });
  };

  const onClickMapHandler = (info: PieceEvent) => {
    if (!winner) return;
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
  };
  const onHoverMapHandler = (info: PieceEvent) => {
    if (!winner) return;
    setTooltipValue(info.object ? info.object.properties.name : "");
  };
  const onViewStateChangeHandler = (viewState: ViewStateEvent) => {
    setViewState(viewState.viewState);
  };

  const onSelectMapHandler = (val: number) => {
    if (val) {
      setPuzzleSelected(val);
      setPieceSelectedData({} as PieceProps);
      setPieceSelected(-1);
      setWinner(false);
      loadGame(val);
    }
  };

  /* Reset the Game */
  const onResetGameHandler = () => {
    removeCookie("quizFounds" + puzzleSelected);
    removeCookie("quizFails" + puzzleSelected);
    removeCookie("quizSeconds" + puzzleSelected);
    removeCookie("quizCorrects" + puzzleSelected);

    setPieceSelected(-1);
    setPieceSelectedData({} as PieceProps);
    setCorrects([]);
    setFails([]);
    setFoundsIds([]);
    setFounds([]);
    setLoading(false);
    setWinner(false);
    setReset(true);
    GameTime.seconds = 0;
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

  /* on reset game */
  useEffect(() => {
    if (reset) {
      setReset(false);
      nextPiece();
    }
  }, [reset]);

  useEffect(() => {
    loadPiecesByLang(puzzleSelected, pieces, lang);
  }, [lang]);

  useEffect(() => {
    if (pieces.length > 0) {
      restoreMapColors();
    }
  }, [pieces]);

  const onLangChangeHandler = (lang: string) => {
    setLang(lang);
  };

  /* load game from db */
  const loadGame = (puzzleId: number) => {
    const langAux = getLang();
    i18n.changeLanguage(langAux);
    setPieces([]);
    setFounds([]);
    setFails([]);
    setCorrects([]);
    setFoundsIds([]);
    setWinner(false);

    setLang(langAux);
    setLoading(true);
    //get puzzle data from db
    PuzzleService.getPuzzle(puzzleId).then((puzzleData: Puzzles) => {
      //get map data from geojson
      Jsondb(puzzleData.data).then((response) => {
        getCustomWikis(puzzleData.id);
        window.history.pushState(
          {},
          puzzleData.name,
          "./?flagQuiz=" + puzzleData.url
        );
        //change title
        document.title = "MapPuzzle.xyz / FlagQuiz - " + puzzleData.name;
        const piecesAux: PieceProps[] = response.features;
        //set name to pieces from pieces.properties.name
        piecesAux.forEach((piece: PieceProps) => {
          piece.name = piece.properties.name;
        });

        setPuzzleSelectedData(puzzleData);
        setPuzzleSelected(puzzleId);

        setData(response);
        loadPiecesByLang(puzzleId, piecesAux, langAux);
        setPieces(piecesAux);
        //restore game status from coockie
        restoreCookies(puzzleId);
        setLoading(false);
      });
    });
  };

  /**
   * Restores the map colors based on the founds, corrects, fails and selected piece.
   * If a piece is found, its color will be set to CORRECT_COLOR.
   * If a piece is failed, its color will be set to WRONG_COLOR.
   * If a piece is selected, its color will be set to SELECTED_COLOR.
   */
  const restoreMapColors = () => {
    if (founds.length > 0) {
      //restore color corrects
      pieces.map((piece: PieceProps) => {
        if (corrects.includes(piece.properties.cartodb_id)) {
          piece.properties.mapcolor = CORRECT_COLOR;
        }
        if (fails.includes(piece.properties.cartodb_id)) {
          piece.properties.mapcolor = WRONG_COLOR;
        }
        if (pieceSelectedData.properties !== undefined) {
          if (
            pieceSelectedData.properties.cartodb_id ===
            piece.properties.cartodb_id
          ) {
            piece.properties.mapcolor = SELECTED_COLOR;
          }
        }
      });
    }
  };

  /**
   * Restores the cookies for the founds, foundsIds, corrects, fails and seconds of the game.
   * @param puzzleId The ID of the selected puzzle.
   */
  const restoreCookies = (puzzleId: number) => {
    const cookieFounds = getCookie("quizFounds" + puzzleId);
    if (cookieFounds) {
      setFounds(cookieFounds.split(",").map(Number));
    } else {
      setFounds([]);
    }
    const cookieFoundsIds = getCookie("quizFoundsIds" + puzzleId);
    if (cookieFoundsIds) {
      setFoundsIds(cookieFoundsIds.split(",").map(Number));
    }

    const cookieCorrects = getCookie("quizCorrects" + puzzleId);
    if (cookieCorrects) {
      setCorrects(cookieCorrects.split(",").map(Number));
    }

    const cookieFails = getCookie("quizFails" + puzzleId);
    if (cookieFails) {
      setFails(cookieFails.split(",").map(Number));
    }
    const cookieSeconds = getCookie("quizSeconds" + puzzleId);
    if (cookieSeconds) {
      GameTime.seconds = parseInt(cookieSeconds);
    } else {
      GameTime.seconds = 0;
    }
  };
  /**
   * Loads custom translations for the pieces in the selected puzzle and language.
   * @param puzzleSelectedAux The ID of the selected puzzle.
   * @param piecesAux An array of PieceProps objects representing the pieces to be translated.
   * @param langAux The language code for the translations.
   */
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
        setPieces(piecesAux);
      }
    );
  }

  /**
   * Returns a random piece that is not the currently selected piece.
   * @param pieces An array of PieceProps objects representing the pieces to choose from.
   * @param selectedPiece The index of the currently selected piece in the pieces array.
   * @returns The index of the randomly selected piece in the pieces array.
   */
  const getRandomPiece = (
    pieces: PieceProps[],
    selectedPiece: number
  ): number => {
    const randomPiece = Math.floor(Math.random() * pieces.length);
    if (randomPiece === selectedPiece) {
      return getRandomPiece(pieces, selectedPiece);
    }
    return randomPiece;
  };

  /**
   * Returns a random piece that has not been found yet.
   * @param pieces An array of PieceProps objects representing the pieces to choose from.
   * @returns The index of the randomly selected piece in the pieces array.
   */
  const getRandomPieceNotFounds = (pieces: PieceProps[]): number => {
    const length = pieces.length - founds.length;
    const randomPiece = Math.floor(Math.random() * length);

    const piecesNotFounds = pieces.filter(
      (piece: PieceProps) => !founds.includes(piece.properties.cartodb_id)
    );

    //find position in pices array from piecesNotFounds ramdomPiece
    const pieceSelectedAux = pieces.findIndex(
      (piece: PieceProps) =>
        piece.properties.cartodb_id ===
        piecesNotFounds[randomPiece].properties.cartodb_id
    );
    return pieceSelectedAux;
  };

  const onCorrectAnswerHandler = () => {
    const correctsAux = [
      ...corrects,
      pieces[pieceSelected].properties.cartodb_id,
    ];
    setCorrects(correctsAux);
    setCookie(
      "quizCorrects" + puzzleSelected,
      correctsAux.join(","),
      ConfigService.cookieDays
    );

    //Set piece to correct color
    setPieceColour(pieceSelected, CORRECT_COLOR);
    nextPiece();
  };

  const onWrongAnswerHandler = () => {
    const failsAux = [...fails, pieces[pieceSelected].properties.cartodb_id];
    setFails(failsAux);
    setCookie(
      "quizFails" + puzzleSelected,
      failsAux.join(","),
      ConfigService.cookieDays
    );

    //Set piece to wrong color
    setPieceColour(pieceSelected, WRONG_COLOR);
    nextPiece();
  };

  /**
   * Sets the color of a puzzle piece.
   * @param {number} pieceId - The ID of the puzzle piece to set the color for.
   * @param {number} color - The color to set for the puzzle piece.
   */
  const setPieceColour = (pieceId: number, color: number) => {
    const piecesAux = [...pieces];
    piecesAux[pieceId].properties.mapcolor = color;
    setPieces(piecesAux);
  };

  /**
   * Selects the next puzzle piece for the quiz, sets its color to the selected color,
   * and generates questions for the quiz based on the selected piece.
   */
  const nextPiece = () => {
    setCookie(
      "quizFounds" + puzzleSelected,
      founds.join(","),
      ConfigService.cookieDays
    );

    if (onWinner()) {
      return;
    }

    if (pieceSelected != -1) {
      const auxFoundsIds = [...foundsIds, pieceSelected];
      setFoundsIds(auxFoundsIds);
      setCookie(
        "quizFoundsIds" + puzzleSelected,
        auxFoundsIds.join(","),
        ConfigService.cookieDays
      );
    }

    const randomPiece = getRandomPieceNotFounds(pieces);
    const pieceSelectedAux = pieces[randomPiece];
    setPieceSelectedData(pieceSelectedAux);
    setPieceColour(randomPiece, SELECTED_COLOR);
    setPieceSelected(randomPiece);
    setFounds([...founds, pieces[randomPiece].properties.cartodb_id]);

    generateQuestions(pieceSelectedAux);

    const centroid = turf.centroid(pieceSelectedAux.geometry);
    let zoom =
      calculateZoom(turf.bbox(pieceSelectedAux.geometry)) * ZOOM_OUT_FACTOR;
    if (zoom < MIN_ZOOM) {
      zoom = MIN_ZOOM;
    }

    const newViewState: ViewState = {
      ...viewState,
      longitude: centroid.geometry.coordinates[0],
      latitude: centroid.geometry.coordinates[1],
      zoom: zoom,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    };
    setViewState(newViewState);
  };

  /**
   * Checks if all puzzle pieces have been found and sets the winner state to true if so.
   * @returns A boolean indicating whether all puzzle pieces have been found.
   */
  const onWinner = (): boolean => {
    //if all pieces are founds
    if (founds.length === pieces.length && pieces.length !== 0) {
      setWinner(true);
      setPieceSelectedData({} as PieceProps);
      setPieceSelected(-1);
      setViewState({
        ...viewState,
        latitude: puzzleSelectedData.view_state?.latitude
          ? puzzleSelectedData.view_state?.latitude
          : 0,
        longitude: puzzleSelectedData.view_state?.longitude
          ? puzzleSelectedData.view_state?.longitude
          : 0,
        zoom: puzzleSelectedData.view_state?.zoom
          ? puzzleSelectedData.view_state?.zoom
          : 1,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!loading) {
      //set first found piece
      nextPiece();
    }
  }, [loading]);

  /**
   * Generates an array of questions for the quiz, including the correct piece and random pieces.
   * @param correctPiece The correct piece for the current question.
   * @returns An array of PieceProps objects representing the questions for the quiz.
   */
  const generateQuestions = (correctPiece: PieceProps) => {
    const questionsAux: PieceProps[] = [];
    //add current piece to questions
    questionsAux.push(correctPiece);
    //add random pieces to questions
    const numQuestions =
      pieces.length - 1 < NUM_QUESTION ? pieces.length - 1 : NUM_QUESTION;
    while (questionsAux.length < numQuestions) {
      const randomPiece = getRandomPiece(pieces, pieceSelected);
      if (
        !questionsAux.find(
          (piece: PieceProps) =>
            piece.properties.cartodb_id ===
            pieces[randomPiece].properties.cartodb_id
        )
      ) {
        questionsAux.push(pieces[randomPiece]);
      }
    }
    //sort questions ramdomly
    setQuestions([...shuffle(questionsAux)]);
  };

  return (
    <React.Fragment>
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <MenuTop
              name="Flags Quiz"
              onSelectMap={onSelectMapHandler}
              onResetGame={onResetGameHandler}
              onFullScreen={onToggle}
              onLangChange={onLangChangeHandler}
              puzzleSelected={puzzleSelected}
            />
            <LoadingDialog show={loading} delay={1000} />
            <div className="quiz-container">
              {!winner && !loading && (
                <div className="piece-quiz">
                  <PieceQuiz
                    puzzleSelected={puzzleSelected}
                    pieceSelected={pieceSelected}
                    pieceSelectedData={pieceSelectedData}
                    questions={questions}
                    pieces={pieces}
                    founds={founds}
                    loading={loading}
                    lang={lang}
                    winner={winner}
                    corrects={corrects.length}
                    fails={fails.length}
                    onCorrect={onCorrectAnswerHandler}
                    onWrong={onWrongAnswerHandler}
                  />
                </div>
              )}
              <div className={winner ? "deckgl-container winner" : "deckgl-container"}>
                <DeckMap
                  onClickMap={onClickMapHandler}
                  onHoverMap={onHoverMapHandler}
                  onViewStateChange={onViewStateChangeHandler}
                  viewState={viewState}
                  founds={founds}
                  data={data}
                />
              </div>
              <YouWin
                winner={winner}
                founds={corrects}
                fails={fails.length}
                onResetGame={onResetGameHandler}
                path={puzzleSelectedData?.url}
                name={puzzleSelectedData?.name}
              />
            </div>
            <Tooltip tooltip={tooltipValue} />
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
          </div>
        )}
      </ReactFullscreeen>
    </React.Fragment>
  );
}

export default FlagQuiz;
