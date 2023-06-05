import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";

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
  const [lang, setLang] = useState("");
  const { i18n } = useTranslation();

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

  const getRandomPiece = (pieces: PieceProps[]) => {
    let found = false;
    let randomPiece = -1;
    while (!found) {
      randomPiece = Math.floor(Math.random() * pieces.length);
      if (
        pieces.find((e: PieceProps) => e.properties.cartodb_id === randomPiece)
      ) {
        found = true;
      }
    }
    return randomPiece;
  };

  const nextPiece = () => {
    const piecesAux = pieces;
    const foundsAux = founds;
    const randomPiece = getRandomPiece(piecesAux);
    const pieceInit = piecesAux[randomPiece];
    setPieceSelectedData(pieceInit);
    setPieceSelected(pieceInit.properties.cartodb_id);
    foundsAux.push(pieceInit.properties.cartodb_id);
    setFounds(foundsAux);
    const centroid = turf.centroid(pieceInit.geometry);
    let zoom = calculateZoom(turf.bbox(pieceInit.geometry)) * 0.8;
    console.log("zoom: " + zoom);
    if (zoom < 1) {
      zoom = 1;
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
    console.log("piece set to: " + pieceInit.properties.name);
  };
  //on loading = false
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
                  pieceSelected={pieceSelected}
                  pieceSelectedData={pieceSelectedData}
                  pieces={pieces}
                  founds={founds}
                  lang={lang}
                  nextPiece={nextPiece}
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
