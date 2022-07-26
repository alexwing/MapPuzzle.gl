import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import LoadingDialog from "../components/LoadingDialog";
import PieceList from "../components/PieceList";
import { PieceProps } from "../models/Interfaces";
import EditMap from "./editMap";
import Puzzles from "../../backend/src/models/puzzles";
import { Tab, Tabs } from "react-bootstrap";
import { PuzzleService } from "../services/puzzleService";
import EditPiece from "./editPiece";

function EditorDialog({
  show = false,
  onHide,
  puzzleSelected = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: any) {
  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [pieceSelectedData, setPieceSelectedData] = useState({} as PieceProps);

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //is showing modal
  useEffect(() => {
    if (showIn) {
      setLoading(false);
    }
  }, [showIn, puzzleSelected]);

  /* Piece is selected on list */
  const onPieceSelectedHandler = async (val: any) => {
    let piece = pieces.find(
      (p: PieceProps) =>
        p.properties.cartodb_id === parseInt(val.target.parentNode.id)
    );
    if (piece) {
      piece = await PuzzleService.updatePieceProps(piece);
      setPieceSelectedData(piece);
      setPieceSelected(val.target.parentNode.id);
    }
  };

  function handleClose() {
    onHide();
  }

  if (loading) return <LoadingDialog show={loading} delay={1000} />;
  return (
    <React.Fragment>
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {puzzleSelected.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            overflowY: "auto",
            minHeight: "calc(100vh - 250px)",
          }}
        >
          <small>
            PuzzleId: {puzzleSelected.id} {puzzleSelected.name} |
            puzzleSelected: {pieceSelected ? pieceSelected : ""}
          </small>
          <Tabs
            defaultActiveKey="puzzle"
            id="uncontrolled-tab-example"
            className="mb-3"
          >
            <Tab eventKey="puzzle" title="Puzzle">
              <Row>
                <EditMap puzzle={puzzleSelected} />
              </Row>
            </Tab>
            <Tab eventKey="pieces" title="Pieces">
              <Row>
                <Col xs={4} lg={4} style={{ padding: "0px" }}>
                  <div
                    style={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 300px)",
                    }}
                  >
                    <PieceList
                      pieces={pieces}
                      founds={[]}
                      onPieceSelected={onPieceSelectedHandler}
                      pieceSelected={pieceSelected}
                    />
                  </div>
                </Col>
                <Col xs={8} lg={8} >
                  <EditPiece piece={pieceSelectedData} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default EditorDialog;
