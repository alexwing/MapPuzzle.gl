import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import LoadingDialog from "../components/LoadingDialog";
import { Puzzle } from "../models/PuzzleDb";
import PieceList from "../components/PieceList";
import { PieceProps } from "../models/Interfaces";
import { Form } from "react-bootstrap";

function EditorDialog({
  show = false,
  onHide,
  puzzleSelected = {} as Puzzle,
  pieces = new Array<PieceProps>(),
}: any) {
  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [error, setError] = useState(false);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [puzzleEdited, setPuzzleEdited] = useState({
    ...puzzleSelected,
  } as Puzzle);

  //on load show modal
  useEffect(() => {
    setShowIn(show);
    setPuzzleEdited(puzzleSelected);
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

  const errorMessage = (
    <Modal
      show={showIn}
      onHide={handleClose}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header className="bg-danger">
        <Modal.Title
          id="contained-modal-title-vcenter"
          className="modal-title-error"
        >
          {puzzleSelected}
        </Modal.Title>
        <Button variant="danger" onClick={handleClose}>
          <i className="close-icon"></i>
        </Button>
      </Modal.Header>
      <Modal.Body className="bg-warning"></Modal.Body>
    </Modal>
  );

  function handleClose() {
    onHide();
  }

  if (loading) return <LoadingDialog show={loading} delay={1000} />;
  if (error) return errorMessage;
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
            <Col xs={8} lg={8}>
              <div>
                <small>
                  PuzzleId: {puzzleSelected.id} {puzzleSelected.name} |
                  puzzleSelected: {pieceSelected ? pieceSelected : ""}
                </small>
                <Form>
                  <Form.Group className="mb-12" controlId="formBasicEmail">
                    <Form.Label>Puzzle Name</Form.Label>
                    <Form.Control type="input" placeholder="Enter puzzle name" value={puzzleEdited.name} onChange={(e) => {
                      setPuzzleEdited({ ...puzzleSelected, name: e.target.value });
                    }
                    } />
                    <Form.Text className="text-muted">
                      Enter a name for the puzzle.                    
                    </Form.Text>
                  </Form.Group>
                </Form>
              </div>
            </Col>
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
