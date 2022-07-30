import React from "react";
import { Nav, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import Puzzles from "../../../backend/src/models/puzzles";

function PuzzleSelector({ puzzles = [], onSelectMap }: any) {
  return (
    <React.Fragment>
      <Nav className="mr-auto">
        <NavDropdown title="Select a Puzzle" id="puzzle">
          {puzzles.map((c: Puzzles) => (
            <NavDropdown.Item
              as={Link}
              id={c.id.toString()}
              key={c.id}
              to={"./?map=" + c.url}
              onClick={onSelectMap}
            >
              <img src={c.icon} alt={c.name} />
              {c.name}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Nav>
    </React.Fragment>
  );
}
export default PuzzleSelector;
