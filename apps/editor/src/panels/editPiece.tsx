import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import type { CustomCentroids } from "@mappuzzle/shared";
import type { CustomWiki } from "@mappuzzle/shared";
import { AlertMessage } from "@mappuzzle/core";
import { ConfigService } from "@mappuzzle/core";
import { getWikiSimple } from "@mappuzzle/core";
import type { PieceProps } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import { BackMapEditorService } from "../services/BackMapEditorService";
import CentroidPicker from "./CentroidPicker";

interface EditPieceProps {
  piece: PieceProps;
  flagsVersion?: number;
  onFlagUpdated?: () => void;
}

function EditPiece({
  piece = {} as PieceProps,
  flagsVersion = 0,
  onFlagUpdated,
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
  const [flagUrl, setFlagUrl] = useState("");
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [uploadingFlag, setUploadingFlag] = useState(false);
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

  const wikiFrameSrc = (() => {
    const title = PieceEdited.customWiki?.wiki;
    if (!title) return "";
    return `${ConfigService.backendUrl}/mapEditor/wikiRender?title=${encodeURIComponent(title)}`;
  })();

  const onReplaceFlagHandler = async () => {
    if (!PieceEdited.id) return;
    if (!flagUrl.trim() && !flagFile) {
      setAlert({
        title: "Error",
        message: "Provide a URL or choose a .svg/.png file",
        type: "danger",
      } as AlertModel);
      setShowAlert(true);
      return;
    }
    setUploadingFlag(true);
    try {
      const result = await BackMapEditorService.replacePieceFlag(
        PieceEdited.id,
        PieceEdited.properties.cartodb_id,
        flagUrl,
        flagFile ?? undefined
      );
      if (result?.success) {
        setAlert({
          title: "Success",
          message: result.msg,
          type: "success",
        } as AlertModel);
        setFlagFile(null);
        setFlagUrl("");
        onFlagUpdated?.();
      } else {
        setAlert({
          title: "Error",
          message: result?.msg ?? "Could not replace the flag",
          type: "danger",
        } as AlertModel);
      }
      setShowAlert(true);
    } catch (e) {
      setAlert({
        title: "Error",
        message: e instanceof Error ? e.message : String(e),
        type: "danger",
      } as AlertModel);
      setShowAlert(true);
    } finally {
      setUploadingFlag(false);
    }
  };

  const currentFlag = PieceEdited.id
    ? `../customFlags/${PieceEdited.id}/64/${PieceEdited.properties.cartodb_id}.png?v=${flagsVersion}`
    : "";

  return !PieceEdited.id ? null : (
    <Col xs={12} lg={12} className="edit-piece">
      <Form autoComplete="off" className="edit-piece-form">
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
        />
        <Row>
          <Col xs={12} lg={12}>
            <Row>
              <Col xs={12} lg={12} className="d-flex justify-content-between align-items-center gap-2">
                <h4 className="mb-0">
                  {PieceEdited.properties.cartodb_id} - {PieceEdited.name}
                </h4>
                <Button variant="primary" size="sm" type="button" onClick={onSaveHandler}>
                  Save piece
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="align-items-stretch edit-piece-body">
          <Col xs={12} lg={5} className="d-flex flex-column">
            <Row className="g-2 mb-2">
              <Col xs={12}>
                <InputGroup size="sm">
                  <Form.Control
                    type="input"
                    placeholder="Wikipedia title"
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
                  <Button variant="outline-secondary" id="link" onClick={wikiLink}>
                    Link
                  </Button>
                </InputGroup>
              </Col>
              <Col xs={12}>
                <Row className="g-2 align-items-stretch">
                  <Col xs={9}>
                    <Row className="g-2">
                      <Col xs={12}>
                        <Form.Control
                          size="sm"
                          type="url"
                          placeholder="Flag URL (.svg/.png)"
                          value={flagUrl}
                          onChange={(e) => setFlagUrl(e.target.value)}
                          disabled={uploadingFlag}
                        />
                      </Col>
                      <Col xs={12}>
                        <InputGroup size="sm">
                          <Form.Control
                            type="file"
                            accept=".svg,.png,image/svg+xml,image/png"
                            disabled={uploadingFlag}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.currentTarget.files?.[0] ?? null;
                              setFlagFile(file);
                            }}
                          />
                          <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={onReplaceFlagHandler}
                            disabled={uploadingFlag || (!flagUrl.trim() && !flagFile)}
                          >
                            Replace flag
                          </Button>
                        </InputGroup>
                      </Col>
                    </Row>
                  </Col>
                  <Col xs={3} className="d-flex align-items-stretch justify-content-center">
                    <div
                      style={{
                        width: "100%",
                        minHeight: "74px",
                        border: "1px solid #dee2e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fff",
                      }}
                    >
                      <img
                        src={currentFlag}
                        alt={PieceEdited.properties?.name ?? "piece flag"}
                        style={{ maxHeight: "68px", maxWidth: "100%" }}
                      />
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
            {PieceEdited.customWiki?.wiki ? (
              <div className="wikiIframe">
                <iframe
                  title="wiki"
                  src={wikiFrameSrc}
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
          <Col xs={12} lg={7}>
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
        </Row>
      </Form>
    </Col>
  );
}

export default EditPiece;
