import React from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import Timer from "./Timer";
import PieceList from "./PieceList";

//translate to hooks
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
  YouWin,
  lang,
  loading,
}: any) {
  return (
    <React.Fragment>
      <Accordion defaultActiveKey="0">
        <Card>
          <Accordion.Toggle as={Card.Header} eventKey="0">
            {name}
            <Timer
              puzzleSelected={puzzleSelected}
              YouWin={YouWin}
              loading={loading}
            />
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
                    handleUp = {handleUp}
                    handleDown = {handleDown}
                    lang={lang}
                    identify="tools"
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
