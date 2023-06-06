import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import "./FlagQuiz.css";
import DeckMap from "../components/DeckMap";
import { FlyToInterpolator, ViewState } from "react-map-gl";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ReactFullscreeen from "react-easyfullscreen";
import MenuTop from "./MenuTop/MenuTop";
import Puzzles from "../../backend/src/models/puzzles";
import { getLang, Jsondb, copyViewState } from "../lib/Utils";
import { PuzzleService } from "../services/puzzleService";
import { useTranslation } from "react-i18next";
import CustomTranslations from "../../backend/src/models/customTranslations";
import LoadingDialog from "../components/LoadingDialog";
import * as turf from "@turf/turf";
import PieceQuiz from "./Quiz/PieceQuiz";

function FlagQuiz(): JSX.Element {
  const [data, setData] = useState({} as GeoJSON.FeatureCollection);
  const [puzzleSelected, setPuzzleSelected] = useState(1);
  const [puzzleSelectedData, setPuzzleSelectedData] = useState({} as Puzzles);
  const [pieceSelectedData, setPieceSelectedData] = useState({} as PieceProps);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [pieces, setPieces] = useState([] as Array<PieceProps>);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({} as ViewState);
  const [founds, setFounds] = useState([] as Array<number>);
  const [foundsIds, setFoundsIds] = useState([] as Array<number>);
  const [lang, setLang] = useState("");
  const { i18n } = useTranslation();

  const MIN_ZOOM = 2.5;
  const ZOOM_OUT_FACTOR = 0.8;

  const CORRECT_COLOR = 1
  const WRONG_COLOR = 4
  const SELECTED_COLOR = 0


  useEffect(() => {
    if (window.location.pathname) {
      const puzzleUrl = window.location.search.substring(5);
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
    //TODO: reset the game
  };

  const onLangChangeHandler = (lang: string) => {
    setLang(lang);
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

  const getRandomPiece = (pieces: PieceProps[]): number => {
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
    //Set piece to wrong color
    setPieceColour(pieceSelected, CORRECT_COLOR);
    nextPiece();
  };

  const onWrongAnswerHandler = () => {    
    
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
    if (pieceSelected != -1) {
      setFoundsIds([...foundsIds, pieceSelected]);
    }
    const randomPiece = getRandomPiece(pieces);
    const pieceSelectedAux = pieces[randomPiece];
    setPieceSelectedData(pieceSelectedAux);
    setPieceColour(randomPiece, SELECTED_COLOR);
    setPieceSelected(randomPiece);
    setFounds([...founds, pieces[randomPiece].properties.cartodb_id]);

    const centroid = turf.centroid(pieceSelectedAux.geometry);
    let zoom = calculateZoom(turf.bbox(pieceSelectedAux.geometry)) * ZOOM_OUT_FACTOR;
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

  return (
    <React.Fragment>
      <ReactFullscreeen>
        {({ onToggle }) => (
          <div>
            <MenuTop
              name="Flag Quiz"
              onSelectMap={onSelectMapHandler}
              onResetGame={onResetGameHandler}
              onFullScreen={onToggle}
              onLangChange={onLangChangeHandler}
              puzzleSelected={puzzleSelected}
            />
            <LoadingDialog show={loading} delay={1000} />
            <div className="quiz-container">
              <div className="piece-quiz">
                <PieceQuiz
                  puzzleId={puzzleSelected}
                  pieceSelected={pieceSelected}
                  pieceSelectedData={pieceSelectedData}
                  pieces={pieces}
                  founds={founds}
                  lang={lang}
                  correct={onCorrectAnswerHandler}
                  wrong={onWrongAnswerHandler}
                />
              </div>
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
            </div>
          </div>
        )}
      </ReactFullscreeen>
    </React.Fragment>
  );
}

export default FlagQuiz;
