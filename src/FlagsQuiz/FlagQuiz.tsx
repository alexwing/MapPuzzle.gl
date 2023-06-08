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
import { getLang, Jsondb, copyViewState, shuffle } from "../lib/Utils";
import GameTime from "../lib/GameTime";
import { PuzzleService } from "../services/puzzleService";
import { useTranslation } from "react-i18next";
import CustomTranslations from "../../backend/src/models/customTranslations";
import LoadingDialog from "../components/LoadingDialog";
import * as turf from "@turf/turf";
import PieceQuiz from "./Quiz/PieceQuiz";
import YouWin from "../components/YouWin";
import { ConfigService } from "../services/configService";

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
  const [fails, setFails] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [questions, setQuestions] = useState([] as Array<PieceProps>);
  const [reset, setReset] = useState(false);

  const MIN_ZOOM = 2.5;
  const ZOOM_OUT_FACTOR = 0.8;

  const CORRECT_COLOR = 1;
  const WRONG_COLOR = 4;
  const SELECTED_COLOR = 0;

  const NUM_QUESTION = 6;

  useEffect(() => {
    if (window.location.pathname) {
      const puzzleUrl = window.location.search.substring(10);
      PuzzleService.getPuzzleIdByUrl(puzzleUrl).then((content: number) => {
        loadGame(content);
      });
    } else {
      loadGame(1);
    }
  }, []);

  const onClickMapHandler = (info: PieceEvent) => {
    //TODO: check if the click is in the correct country
  };
  const onHoverMapHandler = (info: PieceEvent) => {
    //TODO: check if the hover is in the correct country
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
    removeCookie("quizFounds" + puzzleSelected);
    removeCookie("quizFails" + puzzleSelected);
    removeCookie("quizSeconds" + puzzleSelected);
    setPieceSelected(-1);
    setPieceSelectedData({} as PieceProps);
    setCorrects(0);
    setFoundsIds([]);
    setFounds([]);
    setFails(0);
    setWinner(false);
    setReset(true);
    GameTime.seconds = 0;
  };

  /* on reset game */
  useEffect(() => {
    if (reset) {
      setReset(false);
      nextPiece();
    }
  }, [reset]);



  const onLangChangeHandler = (lang: string) => {
    setLang(lang);
    loadPiecesByLang(puzzleSelected, pieces, lang);
  };

  /* load game from db */
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
        window.history.pushState(
          {},
          puzzleData.name,
          "./?flagQuiz=" + puzzleData.url
        );
        //change title
        document.title = "MapPuzzle.xyz / FlagQuiz - " + puzzleData.name;

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
  const restoreCookies = (puzzleId: number) => {
    const cookieFounds = getCookie("quizFounds" + puzzleId);
    if (cookieFounds) {
      setFounds(cookieFounds.split(",").map(Number));
    } else {
      setFounds([]);
    }
    const cookieFails = getCookie("quizFails" + puzzleId);
    if (cookieFails) {
      setFails(parseInt(cookieFails));
    } else {
      setFails(0);
    }
    const cookieSeconds = getCookie("quizSeconds" + puzzleId);
    if (cookieSeconds) {
      GameTime.seconds = parseInt(cookieSeconds);
    } else {
      GameTime.seconds = 0;
    }

    const cookieFoundsIds = getCookie("quizFoundsIds" + puzzleId);
    if (cookieFoundsIds) {
      setFoundsIds(cookieFoundsIds.split(",").map(Number));
    }

    const cookieCorrects = getCookie("quizCorrects" + puzzleId);
    if (cookieCorrects) {
      setCorrects(parseInt(cookieCorrects));
    }
  };

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

  const calculateZoom = (bbox) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const [west, south, east, north] = bbox;
    const viewportSize = Math.min(viewportWidth, viewportHeight);
    const lngDiff = east - west;
    const latDiff = north - south;
    const lngZoom = Math.log2(((360 / 512) * viewportSize) / lngDiff);
    const latZoom = Math.log2(((180 / 512) * viewportSize) / latDiff);
    const zoom = Math.min(lngZoom, latZoom);

    return Math.round(zoom);
  };

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
    setCorrects(corrects + 1);


    //Set piece to wrong color
    setPieceColour(pieceSelected, CORRECT_COLOR);
    nextPiece();
  };

  const onWrongAnswerHandler = () => {
    setFails(fails + 1);


    //Set piece to wrong color
    setPieceColour(pieceSelected, WRONG_COLOR);
    nextPiece();
  };

  const setPieceColour = (pieceId: number, color: number) => {
    const piecesAux = [...pieces];
    piecesAux[pieceId].properties.mapcolor = color;
    setPieces(piecesAux);
  };

  const nextPiece = () => {
    //if all pieces are founds
    if (founds.length === pieces.length && pieces.length !== 0) {
      setWinner(true);
      return;
    }

    if (pieceSelected != -1) {
      setFoundsIds([...foundsIds, pieceSelected]);
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
    console.log("piece set to: " + pieceSelectedAux.properties.name);
  };

  useEffect(() => {
    if (!loading) {
      //set first found piece
      nextPiece();
    }
  }, [loading]);

  const generateQuestions = (correctPiece) => {
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
              {!winner && (
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
                    corrects={corrects}
                    fails={fails}
                    onCorrect={onCorrectAnswerHandler}
                    onWrong={onWrongAnswerHandler}
                  />
                </div>
              )}
              <div className="deckgl-container">
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
                founds={founds}
                fails={fails}
                onResetGame={onResetGameHandler}
                path={puzzleSelectedData?.url}
                name={puzzleSelectedData?.name}
              />
            </div>
          </div>
        )}
      </ReactFullscreeen>
    </React.Fragment>
  );
}

export default FlagQuiz;
