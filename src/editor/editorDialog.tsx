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

function EditorDialog({
  show = false,
  onHide,
  puzzleSelected = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: any) {
  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [pieceSelected, setPieceSelected] = useState(-1);

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
  const onPieceSelectedHandler = (val: any) => {
    setPieceSelected(val.target.parentNode.id);
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
        <Modal.Body>
          <small>
            PuzzleId: {puzzleSelected.id} {puzzleSelected.name} |
            puzzleSelected: {pieceSelected ? pieceSelected : ""}
          </small>
          <Row>
            <Col xs={4} lg={4} style={{ padding: "0px" }}>
              <div
                style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
              >
                <PieceList
                  pieces={pieces}
                  founds={[]}
                  onPieceSelected={onPieceSelectedHandler}
                  pieceSelected={pieceSelected}
                />
              </div>
            </Col>
            <EditMap puzzle={puzzleSelected} />
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default EditorDialog;
