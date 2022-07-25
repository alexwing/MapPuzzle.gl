import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import LoadingDialog from "../components/LoadingDialog";
import { Puzzle } from "../models/PuzzleDb";

function EditorDialog({ show = false, onHide, puzzleSelected = {} as Puzzle  }: any) {


  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [error, setError] = useState(false);

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
      <Modal.Body className="bg-warning">
        <Row>
          <Col>
            <div>
              <small>
                Piece: {puzzleSelected.id} puzzleSelected: {puzzleSelected.name}
              </small>
            </div>
          </Col>
        </Row>
      </Modal.Body>
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
          <Modal.Title id="contained-modal-title-vcenter">{puzzleSelected.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row></Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default EditorDialog;
