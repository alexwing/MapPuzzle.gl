import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import Puzzles from "../../backend/src/models/puzzles";
import AlertMessage from "../components/AlertMessage";
import LoadingDialog from "../components/LoadingDialog";
import { AlertModel, PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import ErrorList from "./errorList";

interface EditorDialogProps {
  puzzle: Puzzles;
  pieces: PieceProps[];
}

function EditMap({
  puzzle = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: EditorDialogProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [langErrors, setLangErrors] = useState([]);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [puzzleEdited, setPuzzleEdited] = useState({
    ...puzzle,
  } as Puzzles);

  //oninit
  useEffect(() => {
    setPuzzleEdited({
      ...puzzle,
    } as Puzzles);
  }, [puzzle]);

  const clearAlert = () => {
    setAlert({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  const onSaveHandler = () => {
    clearAlert();
    PuzzleService.savePuzzle(puzzleEdited)
      .then((result) => {
        setShowAlert(true);
        setAlert({
          title: "Success",
          message: result.message,
          type: "success",
        } as AlertModel);
      })
      .catch((errorMessage) => {
        setShowAlert(true);
        setAlert({
          title: "Error",
          message: errorMessage,
          type: "danger",
        } as AlertModel);
        setAlert(errorMessage);
      });
  };

  const generateThumbnailHandler = async () => {
    setLoading(true);
    await PuzzleService.generateThumbnail(puzzle.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        setLoading(false);
        setAlert({
          title: "Success",
          message: "Thumbnail generated successfully",
          type: "success",
        } as AlertModel);

        setShowAlert(true);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((errorMessage: any) => {
        setLoading(false);
        setAlert({
          title: "Error",
          message: errorMessage.message,
          type: "danger",
        } as AlertModel);
        setAlert(errorMessage);
      });
  };

  const generateFlagsHandler = async () => {
    setLoading(true);
    await PuzzleService.generateFlags(pieces, puzzle.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        setLoading(false);
        setAlert({
          title: "Success",
          message: "Flags generated successfully",
          type: "success",
        } as AlertModel);

        setShowAlert(true);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((errorMessage: any) => {
        setLoading(false);
        setAlert({
          title: "Error",
          message: errorMessage.message,
          type: "danger",
        } as AlertModel);
        setAlert(errorMessage);
      });
  };

  const generateTranslationHandler = async () => {
    setLoading(true);
    const piecesToSend: PieceProps[] = [];
    for (const piece of pieces) {
      piece.id = puzzleEdited.id;
      piecesToSend.push(await PuzzleService.updatePieceProps(piece));
    }
    await PuzzleService.generateTranslation(piecesToSend, puzzle.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        setLoading(false);
        setAlert({
          title: "Success",
          message: "Translation generated successfully",
          type: "success",
        } as AlertModel);

        setShowAlert(true);
        setLangErrors(res.langErrors);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((errorMessage: any) => {
        setLoading(false);
        setAlert({
          title: "Error",
          message: errorMessage.message,
          type: "danger",
        } as AlertModel);
        setShowAlert(true);
      });
  };
  return (
    <React.Fragment>
      <Col xs={12} lg={12}>
        <LoadingDialog show={loading} delay={1000} />
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
        />
        <Form>
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
                <InputGroup>
                  <Form.Control
                    type="input"
                    size="sm"
                    placeholder="Enter puzzle wiki"
                    value={puzzleEdited.wiki}
                    onChange={(e) => {
                      setPuzzleEdited({
                        ...puzzleEdited,
                        wiki: e.target.value,
                      });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    id="link"
                    onClick={() => {
                      window.open(
                        "https://en.wikipedia.org/wiki/" + puzzleEdited.wiki,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    Link
                  </Button>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>Puzzles Description</Form.Label>
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
              <Form.Group className="mb-3" controlId="formEnableWiki">
                <Form.Check
                  type="checkbox"
                  label="Wikipedia Info"
                  checked={puzzleEdited.enableWiki}
                  onChange={(e) => {
                    setPuzzleEdited({
                      ...puzzleEdited,
                      enableWiki: e.target.checked,
                    });
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEnableFlags">
                <Form.Check
                  type="checkbox"
                  label="Flags Icons"
                  checked={puzzleEdited.enableFlags}
                  onChange={(e) => {
                    setPuzzleEdited({
                      ...puzzleEdited,
                      enableFlags: e.target.checked,
                    });
                  }}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col xs={12} lg={12}>
              <Button
                style={{ marginTop: "10px", marginRight: "10px" }}
                variant="primary"
                type="button"
                onClick={onSaveHandler}
              >
                Save
              </Button>
              <Button
                style={{ marginTop: "10px" }}
                variant="primary"
                type="button"
                onClick={generateTranslationHandler}
              >
                Generate translations
              </Button>
              <Button
                style={{ marginTop: "10px", marginLeft: "10px" }}
                variant="primary"
                type="button"
                onClick={generateFlagsHandler}
              >
                Generate flags
              </Button>
              <Button
                style={{ marginTop: "10px", marginLeft: "10px" }}
                variant="primary"
                type="button"
                onClick={generateThumbnailHandler}
              >
                Generate thumbnails
              </Button>
            </Col>
          </Row>
          <Row>
            <Col xs={12} lg={12}>
              <ErrorList customTranslations={langErrors}></ErrorList>
            </Col>
          </Row>
        </Form>
      </Col>
    </React.Fragment>
  );
}

export default EditMap;
