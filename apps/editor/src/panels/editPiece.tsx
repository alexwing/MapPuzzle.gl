import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import type { CustomCentroids } from "@mappuzzle/shared";
import type { CustomWiki } from "@mappuzzle/shared";
import { AlertMessage } from "@mappuzzle/core";
import { getWikiSimple } from "@mappuzzle/core";
import type { PieceProps } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import { BackMapEditorService } from "../services/BackMapEditorService";
import CentroidPicker from "./CentroidPicker";

interface EditPieceProps {
  piece: PieceProps;
}

function EditPiece({
  piece = {} as PieceProps,
}: EditPieceProps): JSX.Element | null {
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [showAlert, setShowAlert] = useState(false);
  const [PieceEdited, setPieceEdited] = useState(piece);
  const [top, setTop] = useState(50);
  const [left, setLeft] = useState(50);
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
  //set piece send to pieceedited
  function updatePieceInfo(pieceProps: PieceProps): PieceProps {
    return {
      ...pieceProps,
      customCentroid: {
        ...pieceProps.customCentroid,
        top: isNaN(top) ? -50 : top,
        left: isNaN(left) ? -50 : left,
      } as CustomCentroids,
    } as PieceProps;
  }

  useEffect(() => {
    setPieceEdited(updatePieceInfo(PieceEdited));
    // eslint-disable-next-line
  }, [top, left]);

  const onSaveHandler = () => {
    const pieceSend = updatePieceInfo(PieceEdited);
    setPieceEdited(pieceSend);

    BackMapEditorService.savePiece(pieceSend)
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
    const link = getWikiSimple(
      PieceEdited.name,
      PieceEdited.customWiki ? PieceEdited.customWiki.wiki : ""
    );
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
            <Row>
              <Col xs={12} lg={12}>
                <h4>
                  {PieceEdited.properties.cartodb_id} - {PieceEdited.name}
                </h4>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="formWiki">
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
        <Row className="align-items-start">
          <Col xs={12} lg={7}>
            <Form.Label>Grab point</Form.Label>
            <CentroidPicker
              piece={PieceEdited}
              left={left}
              top={top}
              onChange={(offsets) => {
                setLeft(offsets.left);
                setTop(offsets.top);
              }}
            />
          </Col>
          <Col xs={12} lg={5}>
            <div className="d-flex justify-content-end mb-2">
              <Button variant="primary" type="button" onClick={onSaveHandler}>
                Save piece
              </Button>
            </div>
            {PieceEdited.customWiki?.wiki ? (
              <div className="wikiIframe">
                <iframe
                  title="wiki"
                  src={`https://en.wikipedia.org/wiki/${PieceEdited.customWiki.wiki}`}
                  width="100%"
                  height="100%"
                ></iframe>
              </div>
            ) : (
              <p className="text-muted small">
                Set a Wikipedia article above to preview it here.
              </p>
            )}
          </Col>
        </Row>
      </Form>
    </Col>
  );
}

export default EditPiece;
