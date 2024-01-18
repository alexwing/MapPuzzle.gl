import React, { useState, useEffect, useContext, useRef } from "react";
import FlagCardsGenerator from "./FlagCardsGenerator"; // Asegúrate de que la ruta de importación sea correcta
import Puzzles from "../../backend/src/models/puzzles";
import { cleanUrlParams, getLang, Jsondb } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import { useTranslation } from "react-i18next";
import { Navbar, Button } from "react-bootstrap";
import ThemeContext from "../components/ThemeProvider";

// Asumiendo que tienes un componente MapPuzzle
const FlagCards = () => {
  const [pieces, setPieces] = useState<PieceProps[]>([]); // Asumiendo que tienes un estado para las piezas
  const { i18n } = useTranslation();
  const [show, setShow] = useState(false);
  const [puzzleId, setPuzzleId] = useState(0);
  const { theme } = useContext(ThemeContext);
  const ref: any = useRef();

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

  const handlePrint = () => {
    const html = ref.current.innerHTML;
    const style = `
      <style>
      @media print {
        .flagCards .imgflag img {
          height: auto;
          width: 100%;
          /* conver svg to black lines withouth fill 
          filter: invert(0) grayscale(1) brightness(1) contrast(1);
          opacity: 0.15;    */
        }
        .flagCards .card-text {
          font-weight: bold;
          text-align: center;
          text-align: center;
        }
        .flagCards .imgflag {
          border: 1px solid #dee2e6;
        }
        
        .flagCards .card {
            box-shadow: none;
            border: 0px;
            padding: 1.5%;
        }      
        .flagCards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-gap: 10px;
        }
      }
      </style>
      `;
    const printWindow = window.open("", "Print");
    if (!printWindow) return;
    printWindow.document.write(style);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <React.Fragment>
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
      <div
        ref={ref}
        className="flagCards"
        style={{ backgroundColor: "white", overflow: "scroll" }}
      >
        <FlagCardsGenerator
          show={true}
          pieces={pieces}
          puzzleId={puzzleId}
          lang={"en"}
        />
      </div>
    </React.Fragment>
  );
};

export default FlagCards;
