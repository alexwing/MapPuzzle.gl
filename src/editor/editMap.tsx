import React, { useState, useEffect } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { Puzzle } from "../models/PuzzleDb";
import { PuzzleService } from "../services/puzzleService";

function EditMap({ puzzle = {} as Puzzle }: any) {
  const [error, setError] = useState("");
  const [puzzleEdited, setPuzzleEdited] = useState({
    ...puzzle,
  } as Puzzle);

  //oninit
  useEffect(() => {
    setPuzzleEdited({
      ...puzzle,
    } as Puzzle);
  }, [puzzle]);

  const onSaveHandler = () => {
    setError("");
    PuzzleService.saveCustomWiki(puzzleEdited)
      .then((result) => {
        setError(result.msg);
      })
      .catch((errorMessage) => {
        setError(errorMessage);
      });
  };

  return (
    <Col xs={8} lg={8}>
      <Form>
        <Row>
          <Col xs={12} lg={12}>
            <Alert variant="warning">
              <Alert.Heading>{error !== "" ? error : null}</Alert.Heading>
            </Alert>
          </Col>
        </Row>
        <Row>
          <Col xs={6} lg={6}>
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
          </Col>
          <Col xs={6} lg={6}>
            <Form.Group className="mb-3" controlId="formData">
              <Form.Label>Puzzle Data</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle data"
                value={puzzleEdited.data}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    data: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formWiki">
              <Form.Label>Puzzle Wiki</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle wiki"
                value={puzzleEdited.wiki}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    wiki: e.target.value,
                  });
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Puzzle Description</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle description"
                value={puzzleEdited.comment}
                onChange={(e) => {
                  setPuzzleEdited({
                    ...puzzleEdited,
                    comment: e.target.value,
                  });
                }}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={12} lg={12}>
            <Button
              style={{ marginTop: "10px" }}
              variant="primary"
              type="button"
              onClick={onSaveHandler}
            >
              Save
            </Button>
          </Col>
        </Row>
      </Form>
    </Col>
  );
}

export default EditMap;
