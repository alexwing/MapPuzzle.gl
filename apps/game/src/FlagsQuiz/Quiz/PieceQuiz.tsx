/* eslint-disable react/no-unknown-property */
import React, { useEffect, useState } from "react";
import { PieceProps } from "../../models/Interfaces";
import { PuzzleService } from "@mappuzzle/core";
import Button from "react-bootstrap/Button";
import { Canvas } from "@react-three/fiber";
import { t } from "i18next";
import { Row, Col, Alert } from "react-bootstrap";
import "../styles/PieceQuiz.css";
import "../styles/responsive.css";
import Timer from "../../components/Timer";
import * as turf from "@turf/turf";
import { calculateDistanceFromEcuador } from "../../lib/Utils";
import { ConfigService } from "@mappuzzle/core";
import FlagSelector from "./FlagSelector";
import { siteAsset } from "@mappuzzle/core";
import ErrorBoundary from "../../components/ErrorBoundary";

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
  const [isRtl, setIsRtl] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [quizResponse, setQuizResponse] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);

  // get background image from distance from ecuador
  useEffect(() => {
    if (pieceSelectedData?.geometry === undefined) return;
    const centroid = turf.centroid(pieceSelectedData.geometry);

    // calculate distance percent from ecuador
    const distance = calculateDistanceFromEcuador(
      centroid.geometry.coordinates[1]
    );

    // get distance from ecuador and multiply by flagQuizBackgrounds number
    const n = Math.floor(distance * ConfigService.flagQuizBackgrounds) + 1;

    setBackgroundImage(siteAsset(`flagQuiz/flagBackground${n}.jpeg`));
  }, [pieceSelectedData]);

  //on init load if rtl lang
  useEffect(() => {
    PuzzleService.getLangIsRtl(lang)
      .then((rtl) => {
        setIsRtl(rtl);
      })
      .catch((err) => {
        console.log(err);
        setIsRtl(false);
      });
  }, [lang]);

  // compute dynamic class for each button based on whether it is correct, selected wrong, or unselected
  const getButtonClass = (c: PieceProps) => {
    let classes = "btn-quiz";
    if (isRtl) {
      classes += " rtl";
    }
    if (quizResponse) {
      if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
        classes += " quiz-correct btn-success";
      } else if (c.properties.cartodb_id === selectedAnswerId) {
        classes += " quiz-wrong-selected btn-danger";
      } else {
        classes += " quiz-wrong-unselected";
      }
    }
    return classes;
  };

  // set variant for buttons if quizResponse is true
  const variant = (c: PieceProps) => {
    if (quizResponse) {
      if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
        return "success";
      } else if (c.properties.cartodb_id === selectedAnswerId) {
        return "danger";
      } else {
        return "secondary";
      }
    } else {
      return undefined;
    }
  };

  //create buttons from questions if pieceSelected === question goto correct or wrong
  const buttons = questions.map((c) => {
    return (
      <Button
        key={c.properties.cartodb_id}
        variant={variant(c)}
        size="lg"      
        className={getButtonClass(c)}
        onClick={() => onClickHandler(c)}
      >
        {c.properties.name}
      </Button>
    );
  });

  // on click button check if correct or wrong
  // and init animate button and show correct or wrong
  const onClickHandler = (c: PieceProps) => {
    //prevent clicks if quizResponse is true
    if (quizResponse) return;
    setQuizResponse(true);
    setSelectedAnswerId(c.properties.cartodb_id);
    // Delay before resetting button states
    setTimeout(() => {
      setQuizResponse(false);
      setSelectedAnswerId(null);
      if (c.properties.cartodb_id === pieceSelectedData.properties.cartodb_id) {
        onCorrect();
      } else {
        onWrong();
      }
    }, ConfigService.flagQuizResponseTime);
  };
  // get flag image url
  const getFlag = (puzzleId: number, c: PieceProps): string => {
    return siteAsset(
      `customFlags/${puzzleId.toString()}/1024/${c.properties.cartodb_id}.png`
    );
  };
  
  // show timer if not winner
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
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <ErrorBoundary
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                padding: "20px",
              }}
            >
              <img
                src={getFlag(puzzleSelected, pieceSelectedData)}
                alt={pieceSelectedData?.properties?.name || "Flag"}
                style={{
                  maxHeight: "85%",
                  maxWidth: "85%",
                  objectFit: "contain",
                  borderRadius: "4px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          }
        >
          <Canvas shadows camera={{ position: [1.4, -1, 6.5], fov: 60 }}>
            <ambientLight intensity={0.25} />
            <FlagSelector flagImageUrl={getFlag(puzzleSelected, pieceSelectedData)}/>
          </Canvas>
        </ErrorBoundary>
      </div>
      <div className="questions">{buttons}</div>
    </React.Fragment>
  );
}

export default PieceQuiz;
