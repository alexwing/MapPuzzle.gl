import React, { useEffect, useState } from "react";
import { Alert, Button, ButtonGroup, Container, Form, Navbar, Spinner } from "react-bootstrap";
import {
  ConfigService,
  Jsondb,
  PuzzleService,
} from "@mappuzzle/core";
import type {
  CustomTranslations,
  PieceProps,
  Puzzles,
} from "@mappuzzle/shared";
import EditorPanels from "./panels/EditorPanels";
import NewMap from "./panels/newMap";
import { BackMapEditorService } from "./services/BackMapEditorService";

/**
 * Shell of the map editor.
 *
 * Two modes, because they are two jobs. Creating a map turns a shapefile into a
 * new puzzle and has nothing to do with whatever puzzle is open; it used to be a
 * tab *inside* an opened puzzle, which meant you had to open an unrelated map
 * before you could make one. Editing works on the puzzle picked in the bar.
 *
 * The editor used to be a modal inside the game, fed by MapPuzzle's state: it
 * received the pieces already read from the map's GeoJSON, renamed and
 * translated. Standing alone, it does that itself.
 */
type Mode = "edit" | "create";
function App(): JSX.Element {
  const [puzzles, setPuzzles] = useState([] as Puzzles[]);
  const [puzzle, setPuzzle] = useState<Puzzles | null>(null);
  const [pieces, setPieces] = useState([] as PieceProps[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [notice, setNotice] = useState("");

  /**
   * Rewrites sitemap.xml for the whole site, so it belongs here and not next to
   * the open puzzle's name, where it used to sit taking the header's best spot.
   */
  const generateSitemap = () => {
    setNotice("Generating sitemap…");
    BackMapEditorService.generateSitemap()
      .then(() => setNotice("sitemap.xml regenerated"))
      .catch((e) => setNotice(`Could not generate the sitemap: ${String(e)}`));
  };

  const loadPuzzles = () => {
    PuzzleService.getPuzzles()
      .then(setPuzzles)
      .catch(() =>
        setError(
          `No puzzles came back from ${ConfigService.backendUrl}. Is the backend running?`
        )
      );
  };

  useEffect(loadPuzzles, []);

  /**
   * Same sequence the game runs on load: the puzzle row, the GeoJSON it points
   * at, then the piece names replaced by their translations.
   */
  const loadPuzzle = async (id: number) => {
    setLoading(true);
    setError("");
    setPieces([]);
    try {
      const selected = await PuzzleService.getPuzzle(id);
      const geojson = await Jsondb(selected.data);
      const loaded: PieceProps[] = geojson?.features ?? [];
      loaded.forEach((piece) => {
        piece.name = piece.properties.name;
      });

      const lang = ConfigService.defaultLang;
      const translations: CustomTranslations[] =
        await PuzzleService.getCustomTranslations(id, lang);
      loaded.forEach((piece) => {
        const translated = translations.find(
          (t) => t.cartodb_id === piece.properties.cartodb_id && t.lang === lang
        )?.translation;
        piece.properties.name = translated ?? piece.name;
      });
      loaded.sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name)
      );

      setPuzzle(selected);
      setPieces(loaded);
    } catch (err) {
      setError(`Could not load the puzzle: ${String(err)}`);
      setPuzzle(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Navbar bg="dark" variant="dark" className="mb-3">
        <Container fluid className="gap-3">
          <Navbar.Brand className="me-0">MapPuzzle editor</Navbar.Brand>

          <ButtonGroup size="sm">
            <Button
              variant={mode === "edit" ? "light" : "outline-light"}
              onClick={() => setMode("edit")}
            >
              Edit a puzzle
            </Button>
            <Button
              variant={mode === "create" ? "light" : "outline-light"}
              onClick={() => setMode("create")}
            >
              New map
            </Button>
          </ButtonGroup>

          <Button
            size="sm"
            variant="outline-light"
            className="ms-auto"
            onClick={generateSitemap}
          >
            Generate sitemap
          </Button>

          {mode === "edit" && (
            <Form.Select
              aria-label="Puzzle to edit"
              style={{ maxWidth: "22rem" }}
              value={puzzle?.id ?? ""}
              onChange={(event) => {
                const id = Number(event.target.value);
                if (id) loadPuzzle(id);
              }}
            >
              <option value="">Select a puzzle…</option>
              {puzzles.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Form.Select>
          )}
        </Container>
      </Navbar>

      <Container fluid>
        {error && <Alert variant="danger">{error}</Alert>}
        {notice && (
          <Alert variant="info" dismissible onClose={() => setNotice("")}>
            {notice}
          </Alert>
        )}

        {mode === "create" && (
          <React.Fragment>
            <p className="text-muted">
              Turn a zipped shapefile into a new puzzle. Once it is created,
              switch to <strong>Edit a puzzle</strong> to fill in its name, icon,
              translations and pieces.
            </p>
            <NewMap onCreated={() => loadPuzzles()} />
          </React.Fragment>
        )}

        {mode === "edit" && (
          <React.Fragment>
            {loading && (
              <div className="text-center my-5">
                <Spinner animation="border" variant="info" />
              </div>
            )}
            {!loading && !puzzle && !error && (
              <Alert variant="secondary">
                Pick a puzzle in the bar above to edit it.
              </Alert>
            )}
            {puzzle && !loading && (
              <EditorPanels puzzleSelected={puzzle} pieces={pieces} />
            )}
          </React.Fragment>
        )}
      </Container>
    </React.Fragment>
  );
}

export default App;
