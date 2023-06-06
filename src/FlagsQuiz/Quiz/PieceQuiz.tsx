import React, { useEffect, useState } from "react";
import { PieceProps } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import Button from "react-bootstrap/Button";
import Flag from "./Flag";
import { Canvas, useFrame } from "react-three-fiber";

interface PieceQuizProps {
  puzzleId: number;
  pieceSelected: number;
  pieceSelectedData: PieceProps;
  pieces: PieceProps[];
  founds: number[];
  lang: string;
  nextPiece: () => void;
}

function PieceQuiz({
  puzzleId,
  pieceSelected,
  pieceSelectedData,
  pieces,
  founds,
  lang,
  nextPiece,
}: PieceQuizProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");

  //on init load if rtl lang
  useEffect(() => {
    PuzzleService.getLangIsRtl(lang)
      .then((isRtl) => {
        setRtlClass(isRtl ? "rtl" : "");
      })
      .catch((err) => {
        console.log(err);
        setRtlClass("");
      });
  }, [lang]);

  const getFlag = (puzzleId: number, c: PieceProps): string => {
    return `../customFlags/${puzzleId.toString()}/1024/${
      c.properties.cartodb_id
    }.png`;
  };

  if (pieceSelected === -1) return <div></div>;
  return (
    <React.Fragment>
      <Button id="nextPiece" variant="outline-primary" onClick={nextPiece}>
        Next
      </Button>      
      <Canvas style={{ width: "30vw", height: "20vw" }}>
        <Flag flagImageUrl={getFlag(puzzleId, pieceSelectedData)} />
      </Canvas>
    </React.Fragment>
  );
}

export default PieceQuiz;
