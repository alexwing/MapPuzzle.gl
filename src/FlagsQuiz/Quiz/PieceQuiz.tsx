import React, { useEffect, useState } from "react";
import { PieceProps } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import Button from "react-bootstrap/Button";
import Flag from "./Flag";
import { Canvas, useFrame } from "react-three-fiber";
import { t } from "i18next";
import { Row, Col, Alert } from "react-bootstrap";

interface PieceQuizProps {
  puzzleId: number;
  pieceSelected: number;
  pieceSelectedData: PieceProps;
  questions: PieceProps[];
  pieces: PieceProps[];
  founds: number[];
  lang: string;
  corrects: number;
  fails: number;
  onCorrect: () => void;
  onWrong: () => void;
}

function PieceQuiz({
  puzzleId,
  pieceSelected,
  pieceSelectedData,
  questions,
  pieces,
  founds,
  lang,
  corrects,
  fails,
  onCorrect,
  onWrong,
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

  //create buttons from questions if pieceSelected === question goto correct or wrong
  const buttons = questions.map((c) => {
    return (
      <Button
        key={c.properties.cartodb_id}
        variant="outline-primary"
        className={rtlClass}
        onClick={() => {
          if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
            onCorrect();
          } else {
            onWrong();
          }
        }}
      >
        {c.properties.name}
      </Button>
    );
  });

  const getFlag = (puzzleId: number, c: PieceProps): string => {
    return `../customFlags/${puzzleId.toString()}/1024/${
      c.properties.cartodb_id
    }.png`;
  };

  if (pieceSelected === -1) return <div></div>;
  return (
    <React.Fragment>
      <div>
        <Row className="score">
          <Col xs={4} lg={4}>
            <Alert variant="success">
              <Alert.Heading>{t("toolsPanel.founds")}</Alert.Heading>
              <hr />
              <p className="mb-0">{corrects}</p>
            </Alert>
          </Col>
          <Col xs={4} lg={4}>
            <Alert variant="warning">
              <Alert.Heading>{t("toolsPanel.remaining")}</Alert.Heading>
              <hr />
              <p className="mb-0">{pieces.length - founds.length}</p>
            </Alert>
          </Col>
          <Col xs={4} lg={4}>
            <Alert variant="danger">
              <Alert.Heading>{t("toolsPanel.fails")}</Alert.Heading>
              <hr />
              <p className="mb-0">{fails}</p>
            </Alert>
          </Col>
        </Row>
      </div>
      <Canvas
        className="flag-container"
        style={{ width: "30vw", height: "20vw" }}
      >
        <Flag flagImageUrl={getFlag(puzzleId, pieceSelectedData)} />
      </Canvas>
      <div className="questions">{buttons}</div>
    </React.Fragment>
  );
}

export default PieceQuiz;
