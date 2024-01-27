import React, { useState, useEffect, useContext } from "react";
import FlagCardsGenerator from "./FlagCardsGenerator"; // Asegúrate de que la ruta de importación sea correcta
import Puzzles from "../../backend/src/models/puzzles";
import { cleanUrlParams, getLang, Jsondb } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import { useTranslation } from "react-i18next";
import { Navbar, Button, Container } from "react-bootstrap";
import ThemeContext from "../components/ThemeProvider";

const FlagCards = (): JSX.Element => {
  const [pieces, setPieces] = useState<PieceProps[]>([]); // Asumiendo que tienes un estado para las piezas
  const { i18n } = useTranslation();
  const [puzzleId, setPuzzleId] = useState(0);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (window.location.pathname) {
      const puzzleUrl = cleanUrlParams(window.location.search.substring(11));
      PuzzleService.getPuzzleIdByUrl(puzzleUrl).then((content: number) => {
        loadGame(content);
      });
    } else {
      loadGame(1);
    }
  }, []);

  const loadGame = async (puzzleId: number) => {
    setPuzzleId(puzzleId);
    const langAux = getLang();
    i18n.changeLanguage(langAux);
    //get puzzle data from db
    const puzzleData: Puzzles = await PuzzleService.getPuzzle(puzzleId);
    //get map data from geojson
    const response = await Jsondb(puzzleData.data);
    const piecesAux: PieceProps[] = response.features;
    //set name to pieces from pieces.properties.name
    piecesAux.forEach((piece: PieceProps) => {
      piece.name = piece.properties.name;
    });
    setPieces(piecesAux);
  };
  

  const handlePrint = async () => {
    window.print();
  };

  return (
    <React.Fragment>
      <header className="App-header">
        <Navbar bg={theme} expand="lg">
          <Navbar.Brand>
            <img src="./logoFlagsQuiz192.png" alt="" />
          </Navbar.Brand>
          <Button
            className="btn btn-primary"
            onClick={handlePrint}
            variant="primary"
          >
            Print
          </Button>
        </Navbar>
      </header>
      <main className="App-main">
        <Container
          className="flagCards"
        >
          <FlagCardsGenerator
            show={true}
            pieces={pieces}
            puzzleId={puzzleId}
            lang={"en"}
          />
        </Container>
      </main>
    </React.Fragment>
  );
};

export default FlagCards;
