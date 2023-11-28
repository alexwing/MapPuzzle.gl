/* eslint-disable react/no-unknown-property */
import React, { useEffect, useState } from "react";
import { PieceProps } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import Button from "react-bootstrap/Button";
import { Canvas } from "@react-three/fiber";
import { t } from "i18next";
import { Row, Col, Alert } from "react-bootstrap";
import "./PieceQuiz.css";
import "./responsive.css";
import Timer from "../../components/Timer";
import * as turf from "@turf/turf";
import { calculateDistanceFromEcuador } from "../../lib/Utils";
import { ConfigService } from "../../services/configService";
import FlagSelector from "./FlagSelector";

interface PieceQuizProps {
  puzzleSelected: number;
  pieceSelected: number;
  pieceSelectedData: PieceProps;
  questions: PieceProps[];
  pieces: PieceProps[];
  founds: number[];
  winner: boolean;
  lang: string;
  loading: boolean;
  corrects: number;
  fails: number;
  onCorrect: () => void;
  onWrong: () => void;
}

function PieceQuiz({
  puzzleSelected,
  pieceSelected,
  pieceSelectedData,
  questions,
  pieces,
  founds,
  winner,
  lang,
  loading,
  corrects,
  fails,
  onCorrect,
  onWrong,
}: PieceQuizProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [quizResponse, setQuizResponse] = useState(false)

  useEffect(() => {
    if (pieceSelectedData?.geometry === undefined) return;
    const centroid = turf.centroid(pieceSelectedData.geometry);

    // calculate distance percent from ecuador
    const distance = calculateDistanceFromEcuador(
      centroid.geometry.coordinates[1]
    );

    // get n from 1 to flagQuizBackgrounds number proportionally to distance
    const n = Math.floor(distance * ConfigService.flagQuizBackgrounds) + 1;

    // console.log(`distance: ${distance} n: ${n}`);

    setBackgroundImage(`./flagQuiz/flagBackground${n}.jpeg`);
  }, [pieceSelectedData]);

  //on init load if rtl lang
  useEffect(() => {
    PuzzleService.getLangIsRtl(lang)
      .then((isRtl) => {
        setRtlClass(isRtl ? "rtl btn-quiz" : "btn-quiz");
      })
      .catch((err) => {
        console.log(err);
        setRtlClass("btn-quiz");
      });
  }, [lang]);

  const variant = (c: PieceProps) => {
    if (quizResponse) {
      if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
        return "success";
      } else {
        return "danger";
      }
    }else {
      return "primary";
    }
  }

  //create buttons from questions if pieceSelected === question goto correct or wrong
  const buttons = questions.map((c) => {
    return (
      <Button
        key={c.properties.cartodb_id}
        variant={variant(c)}
        size="lg"
        className={rtlClass}
        onClick={() => onClickHandler(c)}
      >
        {c.properties.name}
      </Button>
    );
  });



  const onClickHandler = (c: PieceProps) => {
  //prevent clicks if quizResponse is true
  if (quizResponse) return;
   setQuizResponse(true)    
    // Delay before resetting button states
    setTimeout(() => {
        setQuizResponse(false)
        if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
          onCorrect();
        } else {
          onWrong();
        }
      }, ConfigService.flagQuizResponseTime);
    
  }

  const getFlag = (puzzleId: number, c: PieceProps): string => {
    return `../customFlags/${puzzleId.toString()}/1024/${
      c.properties.cartodb_id
    }.png`;
  };

  const showTimer =
    winner || loading ? null : (
      <Timer puzzleSelected={puzzleSelected} name="quizSeconds" />
    );

  if (pieceSelected === -1) return <div></div>;
  return (
    <React.Fragment>
      <div>
        <Row className="score">
          <Col xs={4} lg={4}>
            <Alert variant="success">
              <Alert.Heading>{t("toolsPanel.founds")}</Alert.Heading>
              <p className="mb-0">{corrects}</p>
            </Alert>
          </Col>
          <Col xs={4} lg={4}>
            <Alert variant="warning">
              <Alert.Heading>{t("toolsPanel.remaining")}</Alert.Heading>
              <p className="mb-0">{pieces.length - founds.length}</p>
            </Alert>
          </Col>
          <Col xs={4} lg={4}>
            <Alert variant="danger">
              <Alert.Heading>{t("toolsPanel.fails")}</Alert.Heading>
              <p className="mb-0">{fails}</p>
            </Alert>
          </Col>
        </Row>
      </div>
      {showTimer}
      <div
        className="flag-container"
        style={{
          width: "30vw",
          height: "20vw",
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <Canvas shadows camera={{ position: [1.4, -1, 6.5], fov: 60 }}>
          <pointLight position={[0, 6, 1.5]} intensity={2.25} />
          <ambientLight intensity={0.04} />
          <FlagSelector flagImageUrl={getFlag(puzzleSelected, pieceSelectedData)}/>
        </Canvas>
      </div>
      <div className="questions">{buttons}</div>
    </React.Fragment>
  );
}

export default PieceQuiz;
