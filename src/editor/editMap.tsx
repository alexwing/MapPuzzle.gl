import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Puzzle } from "../models/PuzzleDb";

function EditMap({ puzzle = {} as Puzzle }: any) {
  const [error, setError] = useState(false);
  const [puzzleEdited, setPuzzleEdited] = useState({
    ...puzzle,
  } as Puzzle);

  //oninit
  useEffect(() => {
    setPuzzleEdited({
      ...puzzle,
    } as Puzzle);
  }, [puzzle]);

  const errorMessage = "Save failed";

  return (
    <Col xs={8} lg={8}>
      <Row>
        <Col xs={6} lg={6}>
          {error ? errorMessage : null}

          <Form>
            <Form.Group className="mb-12" controlId="formname">
              <Form.Label>Puzzle Name</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle name"
                value={puzzleEdited.name}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    name: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formUrl">
              <Form.Label>Puzzle Url</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle url"
                value={puzzleEdited.url}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    url: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formIcon">
              <Form.Label>Puzzle Icon</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle icon"
                value={puzzleEdited.icon}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    icon: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Button
              variant="primary"
              type="button"
              style={{ marginTop: "10px" }}
            >
              Save
            </Button>
          </Form>
        </Col>
      </Row>
    </Col>
  );
}

export default EditMap;
