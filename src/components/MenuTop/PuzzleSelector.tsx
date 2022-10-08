import React, { useEffect } from "react";
import { Button, Modal, Nav, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import Puzzles from "../../../backend/src/models/puzzles";

function PuzzleSelector({ show = false, puzzles = [], onSelectMap, onHidePuzzleSelector }: any) {
  const [selectedPuzzle, setSelectedPuzzle] = React.useState(null);
  const [showIn, setShowIn] = React.useState(false);
  const handleCancel = () => {
    onHidePuzzleSelector();
    setSelectedPuzzle(null);
    setShowIn(false);
  };
  const handleOK = () => {
    onHidePuzzleSelector();
    onSelectMap(selectedPuzzle);
    setShowIn(false);
  };

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  const onSelectMapClick = (val: any) => {
    setSelectedPuzzle(val.target.id);
  };

  return (
    <React.Fragment>
      <Modal show={showIn} onHide={handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Select a Puzzle to play</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NavDropdown title="Select a Puzzle" id="puzzle">
            {puzzles.map((c: Puzzles) => (
              <NavDropdown.Item
                as={Link}
                id={c.id.toString()}
                key={c.id}
                to={"./?map=" + c.url}
                onClick={onSelectMapClick}
              >
                <img src={c.icon} alt={c.name} />
                {c.name}
              </NavDropdown.Item>
            ))}
          </NavDropdown>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleOK}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default PuzzleSelector;
