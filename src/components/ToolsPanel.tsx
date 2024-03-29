import "./ToolsPanel.css";
import React from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import Timer from "./Timer";
import PieceList from "./PieceList";
import { PieceProps } from "../models/Interfaces";
import { useTranslation } from "react-i18next";

interface ToolsPanelProps {
  name: string;
  flag: string;
  puzzleSelected: number;
  pieceSelected: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPieceSelected: (pieceId: any) => void;
  handleUp: () => void;
  handleDown: () => void;
  pieces: Array<PieceProps>;
  height: number;
  founds: Array<number>;
  fails: number;
  winner: boolean;
  lang: string;
  loading: boolean;
  enableFlags: boolean;
}

function ToolsPanel({
  name,
  flag,
  puzzleSelected,
  pieceSelected,
  onPieceSelected,
  handleUp,
  handleDown,
  pieces,
  height,
  founds,
  fails,
  winner,
  lang,
  loading,
  enableFlags,
}: ToolsPanelProps): JSX.Element {
  const { t } = useTranslation();

  const accordionTitle = (): JSX.Element => {
    if (flag) {
      return (
        <React.Fragment>
          <div className="flagGradient">
            <img src={flag} />
          </div>
          <div className="mapName">{name}</div>
          {showTimer}
        </React.Fragment>
      );
    }
    return (
      <div>
        <span className="mapName">{name}</span>
        {showTimer}
      </div>
    );
  };

  const showTimer =
    winner || loading ? <div className="timer"/> : <Timer puzzleSelected={puzzleSelected} />;
  return loading ? (
    <React.Fragment></React.Fragment>
  ) : (
    <React.Fragment>
      <Accordion defaultActiveKey="0" className="toolsPanelContainer">
        <Accordion.Item eventKey="0">
          <Accordion.Header>{accordionTitle()}</Accordion.Header>
        </Accordion.Item>
        <Accordion.Collapse eventKey="0">
          <Card>
            <Card.Body>
              <Form>
                <Row className="score">
                  <Col xs={4} lg={4}>
                    <Alert variant="success">
                      <Alert.Heading>{t("toolsPanel.founds")}</Alert.Heading>
                      <p className="mb-0">{founds.length}</p>
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
                <div
                  className="pieceListContainer"
                  style={{
                    overflowY: "auto",
                    maxHeight: height - 190 + "px",
                  }}
                >
                  <PieceList
                    pieces={pieces}
                    founds={founds}
                    onPieceSelected={onPieceSelected}
                    pieceSelected={pieceSelected}
                    handleUp={handleUp}
                    handleDown={handleDown}
                    puzzleId={puzzleSelected}
                    enableFlags={enableFlags}
                    lang={lang}
                  />
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Accordion.Collapse>
      </Accordion>
    </React.Fragment>
  );
}

export default ToolsPanel;
