import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Nav, Row, Tab } from "react-bootstrap";
import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import AlertMessage from "../components/AlertMessage";
import { getWikiSimple } from "../lib/Utils";
import { AlertModel, PieceProps } from "../models/Interfaces";
import { BackMapEditorService } from "../services/BackMapEditorService";
import PiecePreview from "./PiecePreview";

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
  const [intensity, setIntensity] = useState(2.5);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NumericOnly = (e: any) => {
    // Allow only numbers . + -
    const reg = /^[0-9.-]+$/;
    const preval = e.target.value;
    if (e.target.value === "" || reg.test(e.target.value)) return true;
    else e.target.value = preval.substring(0, preval.length - 1);
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
        <Row>
          <Col xs={12} lg={12}>
            <Tab.Container defaultActiveKey="position">
              <Nav variant="tabs" defaultActiveKey="/home" className="mt-3">
                <Nav.Item>
                  <Nav.Link eventKey="position">Position</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="wikipedia">Wikipedia</Nav.Link>
                </Nav.Item>
                <Nav.Item className="right-align">
                  <Button
                  className="save-btn"
                    variant="primary"
                    type="button"
                    onClick={onSaveHandler}
                  >
                    Save
                  </Button>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="position">
                  <Row>
                    <Col xs={4} lg={4}>
                      <Form.Group className="mb-6" controlId="formLeft">
                        <Form.Label>Centre accuracy</Form.Label>
                        <InputGroup
                          className="mb-6"
                          style={{ width: "100%", height: "100%" }}
                        >
                          <Form.Control
                            type="range"
                            className="slider"
                            min="0.1"
                            max="10"
                            step={0.1}
                            value={intensity}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e: any) => {
                              if (!e.target.onInputHasBeenCalled) {
                                setIntensity(
                                  parseFloat(e.target.value.toString())
                                );
                                e.target.onInputHasBeenCalled = true;
                              } else {
                                e.target.onInputHasBeenCalled = false;
                              }
                            }}
                          />
                        </InputGroup>
                      </Form.Group>
                      <Form.Group className="mb-3 " controlId="formTop">
                        <Form.Label>Offset</Form.Label>
                        <InputGroup>
                          <Button
                            className="btn-cursor"
                            variant="outline-secondary"
                            id="button-add"
                            onClick={() => {
                              setTop(top + intensity);
                            }}
                          >
                            &uarr;
                          </Button>
                          <Form.Control
                            hidden={true}
                            type="input"
                            className=""
                            placeholder="Enter offset top"
                            value={top}
                            onChange={(e) => {
                              NumericOnly(e);
                              setTop(parseFloat(e.target.value));
                            }}
                          />
                          <Button
                            className="btn-cursor"
                            variant="outline-secondary"
                            id="button-minus"
                            onClick={() => {
                              setTop(top - intensity);
                            }}
                          >
                            &darr;
                          </Button>
                        </InputGroup>
                        <InputGroup>
                          <Button
                            className="btn-cursor"
                            variant="outline-secondary"
                            id="button-add"
                            onClick={() => {
                              setLeft(left + intensity);
                            }}
                          >
                            &larr;
                          </Button>
                          <Form.Control
                            hidden={true}
                            type="input"
                            className=""
                            placeholder="Enter offset left"
                            value={left}
                            onChange={(e) => {
                              NumericOnly(e);
                              setLeft(parseFloat(e.target.value));
                            }}
                          />
                          <Button
                            className="btn-cursor"
                            variant="outline-secondary"
                            id="button-minus"
                            onClick={() => {
                              setLeft(left - intensity);
                            }}
                          >
                            &rarr;
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col xs={8} lg={8}>
                      <PiecePreview
                        selected={PieceEdited}
                        centroid={PieceEdited.customCentroid}
                      />
                    </Col>
                  </Row>                  
                </Tab.Pane>
                <Tab.Pane eventKey="wikipedia">
                  <Row>
                    <Col xs={12} lg={12} className="wikiIframe">
                      <iframe
                        title="wiki"
                        src={`https://en.wikipedia.org/wiki/${PieceEdited.customWiki?.wiki}`}
                        width="100%"
                        height="100%"
                      ></iframe>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Col>
        </Row>
      </Form>
    </Col>
  );
}

export default EditPiece;
