import React, { useEffect, useState } from "react";
import { PieceProps } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import Button from "react-bootstrap/Button";
import Flag from "./Flag";
import { Canvas, useFrame } from "react-three-fiber";

interface PieceQuizProps {
  pieceSelected: number;
  pieceSelectedData: PieceProps;
  pieces: PieceProps[];
  founds: number[];
  lang: string;
  nextPiece: () => void;
}

function PieceQuiz({
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
    //http://localhost:3000/customFlags/1/64/5.png
    console.log("the flat complete url is: https://localhost:3000/customFlags/" + puzzleId.toString() + "/1024/" + c.properties.cartodb_id.toString() + ".png");
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
        <Flag flagImageUrl={getFlag(1, pieceSelectedData)} />
      </Canvas>

    </React.Fragment>
  );
}

export default PieceQuiz;
