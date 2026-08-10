import React, { useState, useEffect } from "react";
import {
  Button,
  Col,
  Dropdown,
  Form,
  InputGroup,
  NavDropdown,
  ProgressBar,
  Row,
} from "react-bootstrap";
import type { Puzzles } from "@mappuzzle/shared";
import type { Countries } from "@mappuzzle/shared";
import { AlertMessage } from "@mappuzzle/core";
import type { FlagsIcons, PieceProps } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import { BackMapEditorService } from "../services/BackMapEditorService";
import { BackWikiService } from "../services/BackWikiService";
import type { JobProgress } from "../services/BackWikiService";
import ErrorList from "./errorList";

interface EditorDialogProps {
  puzzle: Puzzles;
  pieces: PieceProps[];
}

function EditMap({
  puzzle = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: EditorDialogProps): JSX.Element | null {
  const [showAlert, setShowAlert] = useState(false);
  const [progress, setProgress] = useState({
    running: false,
    title: "",
    done: 0,
    total: 0,
    label: "",
  });
  const [langErrors, setLangErrors] = useState([]);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [puzzleEdited, setPuzzleEdited] = useState({
    ...puzzle,
  } as Puzzles);
  const [subfix, setSubfix] = useState("");
  const [countryList, setCountryList] = useState([] as Countries[]);
  const [countryFlags, setCountryFlags] = useState([] as FlagsIcons[]);
  //oninit     loadCountries();

  useEffect(() => {
    loadCountries();
    loadFlags();
  }, []);

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
    BackMapEditorService.savePuzzle(puzzleEdited)
      .then((result) => {
        setShowAlert(true);
        setAlert({
          title: "Success",
          message: result.msg,
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

  const loadCountries = () => {
    BackMapEditorService.getCountries()
      .then((result) => {
        setCountryList(result.data);
      })
      .catch((errorMessage) => {
        setAlert({
          title: "Error",
          message: errorMessage,
          type: "danger",
        } as AlertModel);
        setAlert(errorMessage);
      });
  };

  const loadFlags = () => {
    BackMapEditorService.getCountryFlags()
      .then((result) => {
        setCountryFlags(result.data);
      })
      .catch((errorMessage) => {
        setAlert({
          title: "Error",
          message: errorMessage,
          type: "danger",
        } as AlertModel);
        setAlert(errorMessage);
      });
  };

  /**
   * Runs one of the content jobs, showing where it is while it works.
   *
   * All four walk every piece and pause between Wikipedia calls, so they take
   * minutes. Before this the editor showed a spinner and then one fixed line —
   * "Wiki links generated successfully" — whether it had resolved forty articles
   * or none, and the backend's own summary was thrown away.
   */
  const runJob = async (
    title: string,
    job: (onProgress: (p: JobProgress) => void) => Promise<any>
  ) => {
    setProgress({ running: true, title, done: 0, total: 0, label: "starting…" });
    try {
      const res = await job((p) =>
        setProgress({ running: true, title, ...p })
      );
      setAlert({
        title: res?.success === false ? `${title}: finished with problems` : title,
        message: res?.msg ?? "The job gave no summary",
        type: res?.success === false ? "warning" : "success",
      } as AlertModel);
      setShowAlert(true);
      if (res?.langErrors) setLangErrors(res.langErrors);
      if (res?.error && Array.isArray(res.error)) setLangErrors(res.error);
    } catch (e) {
      setAlert({
        title: `${title}: failed`,
        message: e instanceof Error ? e.message : String(e),
        type: "danger",
      } as AlertModel);
      setShowAlert(true);
    } finally {
      setProgress({ running: false, title: "", done: 0, total: 0, label: "" });
    }
  };

  const generateWikiLinksHandler = () =>
    runJob("Wikipedia links", (onProgress) =>
      BackWikiService.generateWikiLinks(pieces, puzzle.id, subfix, onProgress)
    );

  const generateThumbnailHandler = () =>
    runJob("Flag thumbnails", (onProgress) =>
      BackWikiService.generateThumbnail(puzzle.id, onProgress)
    );

  /** Both of these need each piece's stored wiki and centroid first. */
  const piecesWithProps = async (): Promise<PieceProps[]> => {
    const out: PieceProps[] = [];
    for (const piece of pieces) {
      piece.id = puzzleEdited.id;
      out.push(await BackMapEditorService.updatePieceProps(piece));
    }
    return out;
  };

  const generateFlagsHandler = () =>
    runJob("Piece flags", async (onProgress) =>
      BackWikiService.generateFlags(await piecesWithProps(), puzzle.id, onProgress)
    );

  const generateTranslationHandler = () =>
    runJob("Translations", async (onProgress) =>
      BackWikiService.generateTranslation(
        await piecesWithProps(),
        puzzle.id,
        onProgress
      )
    );

  const navDropdownTitle = (
    <span>
      <img
        alt="flag"
        src={puzzleEdited.icon}
        className="flag-selector-icon"
      ></img>
      <span className="d-none d-lg-inline d-lg-none">
        {countryFlags.find((flag) => flag.url === puzzleEdited.icon)?.name}
      </span>
    </span>
  );

  return (
    <React.Fragment>
      <Col xs={12} lg={12}>
        {/* autoClose 0: the job summary is the point, and the default second
            was not long enough to read "12 flags downloaded, 3 with no image". */}
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
          autoClose={0}
        />
        <Form>
          <Row>
            <Col xs={6} lg={6}>
              <Form.Group className="mb-12" controlId="formname">
                <Form.Label>Puzzle Name: {puzzleEdited.id}</Form.Label>
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
                <NavDropdown
                  className="flag-selector form-control"
                  title={navDropdownTitle}
                  id="dropdown-basic-button"
                >
                  {countryFlags.map((country) => (
                    <Dropdown.Item
                      className="flag-selector"
                      key={country.url}
                      onClick={() => {
                        setPuzzleEdited({
                          ...puzzleEdited,
                          icon: country.url,
                        });
                      }}
                    >
                      <img
                        alt="flag"
                        src={country.url}
                        className="flag-selector-icon"
                      />
                      {country.name}
                    </Dropdown.Item>
                  ))}
                </NavDropdown>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formLatitude">
                <Form.Label>Puzzle Latitude</Form.Label>
                <Form.Control
                  size="sm"
                  type="input"
                  placeholder="Enter puzzle latitude"
                  value={puzzleEdited.view_state?.latitude.toFixed(3)}
                  onChange={(e) => {
                    if (
                      puzzleEdited.view_state !== undefined &&
                      puzzleEdited.view_state !== null
                    ) {
                      setPuzzleEdited({
                        ...puzzleEdited,
                        view_state: {
                          ...puzzleEdited.view_state,
                          latitude: parseFloat(e.target.value),
                        },
                      });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formLongitude">
                <Form.Label>Puzzle Longitude</Form.Label>
                <Form.Control
                  size="sm"
                  type="input"
                  placeholder="Enter puzzle longitude"
                  value={puzzleEdited.view_state?.longitude.toFixed(3)}
                  onChange={(e) => {
                    if (
                      puzzleEdited.view_state !== undefined &&
                      puzzleEdited.view_state !== null
                    ) {
                      setPuzzleEdited({
                        ...puzzleEdited,
                        view_state: {
                          ...puzzleEdited.view_state,
                          longitude: parseFloat(e.target.value),
                        },
                      });
                    }
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formZoom">
                <Form.Label>Puzzle Zoom</Form.Label>
                <Form.Control
                  size="sm"
                  type="input"
                  placeholder="Enter puzzle zoom"
                  value={puzzleEdited.view_state?.zoom}
                  onChange={(e) => {
                    if (
                      puzzleEdited.view_state !== undefined &&
                      puzzleEdited.view_state !== null
                    ) {
                      setPuzzleEdited({
                        ...puzzleEdited,
                        view_state: {
                          ...puzzleEdited.view_state,
                          zoom: parseFloat(e.target.value),
                        },
                      });
                    }
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
              <Form.Group className="mb-3" controlId="formZoom">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  size="sm"
                  as="select"
                  value={puzzleEdited.countryCode}
                  onChange={(e) => {
                    setPuzzleEdited({
                      ...puzzleEdited,
                      countryCode: parseInt(e.target.value),
                    });
                  }}
                >
                  {countryList.map((country) => (
                    <option
                      key={country.countrycode}
                      value={country.countrycode}
                    >
                      {country.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          {/* Save is the puzzle's own field edits. The generators below reach
              out to Wikipedia and rewrite rows for every piece, so they are
              separated from it rather than sharing a row of buttons. */}
          <Row>
            <Col xs={12} className="d-flex justify-content-end mt-3">
              <Button variant="primary" type="button" onClick={onSaveHandler}>
                Save puzzle
              </Button>
            </Col>
          </Row>

          <hr className="mt-4" />

          {progress.running && (
            <Row className="mt-3">
              <Col xs={12}>
                <div className="d-flex justify-content-between small mb-1">
                  <strong>{progress.title}</strong>
                  <span className="text-muted">
                    {progress.total > 0
                      ? `${progress.done} of ${progress.total} — ${progress.label}`
                      : progress.label}
                  </span>
                </div>
                <ProgressBar
                  now={progress.total > 0 ? (progress.done / progress.total) * 100 : 100}
                  // Striped and animated with nothing to divide by yet, so the
                  // bar shows it is working rather than sitting empty at zero.
                  striped={progress.total === 0}
                  animated={progress.total === 0}
                  label={
                    progress.total > 0
                      ? `${Math.round((progress.done / progress.total) * 100)}%`
                      : undefined
                  }
                />
              </Col>
            </Row>
          )}

          <Row>
            <Col xs={12}>
              <h5>Bulk content</h5>
              <p className="text-muted small mb-3">
                These run over every piece in the puzzle and call Wikipedia, so
                they take minutes and overwrite what is already stored. Run them
                in this order the first time.
              </p>
            </Col>
          </Row>
          <Row className="g-3">
            <Col xs={12} lg={6}>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={generateWikiLinksHandler}
                  disabled={progress.running}
                >
                  1. Wikipedia links
                </Button>
                <Form.Control
                  style={{ maxWidth: "170px" }}
                  type="input"
                  placeholder="Name suffix, optional"
                  value={subfix}
                  onChange={(e) => {
                    setSubfix(e.target.value);
                  }}
                />
              </div>
              <div className="form-text">
                Resolves an article per piece. The suffix disambiguates names,
                e.g. &quot;Province&quot;.
              </div>
            </Col>
            <Col xs={12} lg={6}>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={generateTranslationHandler}
                disabled={progress.running}
              >
                2. Translations
              </Button>
              <div className="form-text">
                Piece names in every active language, from the articles above.
              </div>
            </Col>
            <Col xs={12} lg={6}>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={generateFlagsHandler}
                disabled={progress.running}
              >
                3. Piece flags
              </Button>
              <div className="form-text">
                Downloads a flag per piece. Only useful with Enable flags on.
              </div>
            </Col>
            <Col xs={12} lg={6}>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={generateThumbnailHandler}
                disabled={progress.running}
              >
                4. Flag thumbnails
              </Button>
              <div className="form-text">
                Resizes those flags to the sizes the game requests.
              </div>
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
