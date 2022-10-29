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


interface ToolsPanelProps {
  name: string;
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
}


function ToolsPanel({
  name,
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
}: ToolsPanelProps) : JSX.Element {
  const showTimer =
  winner || loading ? null : <Timer puzzleSelected={puzzleSelected} />;

  return !puzzleSelected ? (<React.Fragment></React.Fragment>) : (
    <React.Fragment>
      <Accordion defaultActiveKey="0">
        <Card>
          <Accordion.Toggle as={Card.Header} eventKey="0">
            {name}
            {showTimer}
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <Form>
                <Row className="score">
                  <Col xs={4} lg={4}>
                    <Alert variant="success">
                      <Alert.Heading>Founds:</Alert.Heading>
                      <hr />
                      <p className="mb-0">{founds.length}</p>
                    </Alert>
                  </Col>
                  <Col xs={4} lg={4}>
                    <Alert variant="warning">
                      <Alert.Heading>Remaining:</Alert.Heading>
                      <hr />
                      <p className="mb-0">{pieces.length - founds.length}</p>
                    </Alert>
                  </Col>
                  <Col xs={4} lg={4}>
                    <Alert variant="danger">
                      <Alert.Heading>Fails:</Alert.Heading>
                      <hr />
                      <p className="mb-0">{fails}</p>
                    </Alert>
                  </Col>
                </Row>
                <div
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
                    lang={lang}
                  />
                </div>
              </Form>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    </React.Fragment>
  );
}

export default ToolsPanel;
