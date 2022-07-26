import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import CustomWiki from "../../backend/src/models/customWiki";
import AlertMessage from "../components/AlertMessage";
import { AlertModel, PieceProps } from "../models/Interfaces";

function EditPiece({ piece = {} as PieceProps }: any) {
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [showAlert, setShowAlert] = useState(false);
  const [PieceEdited, setPieceEdited] = useState(piece);

  //oninit
  useEffect(() => {
    setPieceEdited(piece);
  }, [piece]);

  const clearAlert = () => {
    setAlert({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  const onSaveHandler = () => {};
  return (
    <Col xs={8} lg={8}>
      <Form>
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
        />
        <Row>
          <Col xs={6} lg={6}>
            <Form.Group className="mb-3" controlId="formWiki">
              <Form.Label>Puzzles Wiki</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter puzzle wiki"
                value={PieceEdited.customWiki?.wiki}
                onChange={(e) => {
                  setPieceEdited({
                    ...PieceEdited,
                    customWiki: {
                      id: piece.id,
                      cartodb_id: piece.properties.cartodb_id,
                      wiki: e.target.value,
                    } as CustomWiki,
                  });
                }}
              />
            </Form.Group>
          </Col>
          <Col xs={6} lg={6}></Col>
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

export default EditPiece;
