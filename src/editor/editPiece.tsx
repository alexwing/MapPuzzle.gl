import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import AlertMessage from "../components/AlertMessage";
import { AlertModel, PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import PiecePreview from "./PiecePreview";

function EditPiece({ piece = {} as PieceProps }: any) {
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [showAlert, setShowAlert] = useState(false);
  const [PieceEdited, setPieceEdited] = useState(piece);
  const [top, setTop] = useState("50");
  const [left, setLeft] = useState("50");
  //oninit
  useEffect(() => {
    setPieceEdited(piece);
    if (piece.customCentroid) {
      setTop(piece.customCentroid.top);
      setLeft(piece.customCentroid.left);
    }
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


  //set piece send to pieceedited
  function updatePieceInfo(PieceEdited: PieceProps): PieceProps {
    return {
      ...PieceEdited,
      customCentroid: {
        ...PieceEdited.customCentroid,
        top: isNaN(parseInt(top)) ? -50 : parseInt(top),
        left: isNaN(parseInt(left)) ? -50 : parseInt(left),
      } as CustomCentroids,
    } as PieceProps;
  }

  useEffect(() => {
    setPieceEdited(updatePieceInfo(PieceEdited));
  }
  , [top, left]);

  const onSaveHandler = () => {
    const pieceSend = updatePieceInfo(PieceEdited);
    setPieceEdited(pieceSend);

    PuzzleService.savePiece(pieceSend)
      .then((result) => {
        setAlert({
          title: "Success",
          message: result.msg,
          type: "success",
        } as AlertModel);
        setShowAlert(true);
      })
      .catch((errorMessage) => {
        setAlert({
          title: "Error",
          message: errorMessage,
          type: "danger",
        } as AlertModel);
        setShowAlert(true);
        setAlert(errorMessage);
      });
  };

  const wikiLink = () => {
    const link =
      PieceEdited.customWiki?.wiki === ""
        ? PieceEdited.properties.name
        : PieceEdited.customWiki?.wiki;
    window.open(
      `https://en.wikipedia.org/wiki/${link}`,
      "_blank",
      "noopener,noreferrer"
    );
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
              <InputGroup>
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
                <Button
                  variant="outline-secondary"
                  id="link"
                  onClick={wikiLink}
                >
                  Link
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
            </Row>
        <Row>
          <Col xs={6} lg={6}>
            <Form.Group className="mb-3 " controlId="formTop">
              <Form.Label>Offset Top</Form.Label>
              <InputGroup>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  id="button-add"
                  onClick={() => {
                    setTop(parseInt(top) - 5 + "");
                  }}
                >
                  -
                </Button>
                <Form.Control
                  size="sm"
                  type="input"
                  className=""
                  placeholder="Enter offset top"
                  value={top}
                  step="0.1"
                  onChange={(e) => {
                    NumericOnly(e);
                    setTop(e.target.value);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline-secondary"
                  id="button-minus"
                  onClick={() => {
                    setTop(parseInt(top) + 5 + "");
                  }}
                >
                  +
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formLeft">
              <Form.Label>Offset Left</Form.Label>
              <InputGroup>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  id="button-add"
                  onClick={() => {
                    setLeft(parseInt(left) - 5 + "");
                  }}
                >
                  -
                </Button>
                <Form.Control
                  size="sm"
                  type="input"
                  className=""
                  placeholder="Enter offset left"
                  value={left}
                  step="1"
                  onChange={(e) => {
                    NumericOnly(e);
                    setLeft(e.target.value);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline-secondary"
                  id="button-minus"
                  onClick={() => {
                    setLeft(parseInt(left) + 5 + "");
                  }}
                >
                  +
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>

          <Col xs={6} lg={6}>
            <PiecePreview
              selected={PieceEdited}
              centroid={PieceEdited.customCentroid}
              zoom={3}
            />
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
