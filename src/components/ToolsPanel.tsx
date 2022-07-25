import React, { Component } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import Timer from "./Timer";
import Legend from "./Legend";

class ToolsPanel extends Component<any, any> {
  render() {
    const { height, pieceSelected, pieces, onPieceSelected, founds } =
      this.props;

    return (
      <Accordion defaultActiveKey="0">
        <Card>
          <Accordion.Toggle as={Card.Header} eventKey="0">
            {this.props.name}
            <Timer
              YouWin={this.props.YouWin}
              puzzleSelected={this.props.puzzleSelected}
              loading={this.props.loading}
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
                      <p className="mb-0">{this.props.fails}</p>
                    </Alert>
                  </Col>
                </Row>
                <div
                  style={{ overflowY: "auto", maxHeight: height - 190 + "px" }}
                >
                  <Legend pieces={pieces} founds={founds} onPieceSelected={onPieceSelected} pieceSelected={pieceSelected} />
                </div>
              </Form>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    );
  }
}

export default ToolsPanel;
