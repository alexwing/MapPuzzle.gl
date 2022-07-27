import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import CustomCentroids from "../../backend/src/models/customCentroids";
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
  const [top, setTop] = useState("0.0");
  const [left, setLeft] = useState("0.0");
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
  const NumericOnly = (e: any) => {
    // Allow only numbers . + -
    const reg = /^[0-9.-]+$/;
    let preval = e.target.value;
    if (e.target.value === "" || reg.test(e.target.value)) return true;
    else e.target.value = preval.substring(0, preval.length - 1);
  };
  const onSaveHandler = () => {
    setPieceEdited({
      ...PieceEdited,
      customCentroid: {
        ...PieceEdited.customCentroid,
        top: isNaN(parseFloat(top)) ? 0 : parseFloat(top),
        left: isNaN(parseFloat(left)) ? 0 : parseFloat(left),
      } as CustomCentroids,
    });
  };
  return !PieceEdited.id ? null : (
    <Col xs={12} lg={12}>
      <Form autoComplete="off">
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
        />
        <Row>
          <Col xs={12} lg={12}>
            <Form.Group className="mb-3" controlId="formWiki">
              <Form.Label>Piece Wiki</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  type="input"
                  placeholder="Enter puzzle wiki"
                  value={PieceEdited.customWiki?.wiki}
                  onChange={(e) => {
                    setPieceEdited({
                      ...PieceEdited,
                      customWiki: {
                        ...PieceEdited.customWiki,
                        wiki: e.target.value,
                      } as CustomWiki,
                    });
                  }}
                />
                <Button variant="outline-secondary" id="link" onClick={() => {
                  window.open("https://en.wikipedia.org/wiki/"+PieceEdited.customWiki?.wiki, "_blank", "noopener,noreferrer");
                }
                }>
                  Link
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formLeft">
              <Form.Label>Offset Left</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter offset left"
                value={PieceEdited.customCentroid?.left}
                step="0.1"
                onChange={(e) => {
                  NumericOnly(e);
                  setLeft(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formTop">
              <Form.Label>Offset Top</Form.Label>
              <Form.Control
                size="sm"
                type="input"
                placeholder="Enter offset top"
                value={PieceEdited.customCentroid?.top}
                onChange={(e) => {
                  NumericOnly(e);
                  setTop(e.target.value);
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

export default EditPiece;
