import React, { useEffect, useState } from "react";
import { Alert, Container, Form, Navbar, Spinner } from "react-bootstrap";
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

/**
 * Shell of the map editor.
 *
 * The editor used to be a modal inside the game, fed by MapPuzzle's state: it
 * received the pieces already read from the map's GeoJSON, renamed and
 * translated. Now that it stands alone it has to do that itself, which is all
 * this component is: pick a puzzle, load it, hand it to the panels.
 */
function App(): JSX.Element {
  const [puzzles, setPuzzles] = useState([] as Puzzles[]);
  const [puzzle, setPuzzle] = useState<Puzzles | null>(null);
  const [pieces, setPieces] = useState([] as PieceProps[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    PuzzleService.getPuzzles()
      .then(setPuzzles)
      .catch(() =>
        setError(
          `No puzzles came back from ${ConfigService.backendUrl}. Is the backend running?`
        )
      );
  }, []);

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
        <Container fluid>
          <Navbar.Brand>MapPuzzle editor</Navbar.Brand>
          <Form.Select
            aria-label="Puzzle to edit"
            style={{ maxWidth: "24rem" }}
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
        </Container>
      </Navbar>

      <Container fluid>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="info" />
          </div>
        )}
        {!loading && !puzzle && !error && (
          <Alert variant="secondary">
            Pick a puzzle above to edit it, or create a new map from the New Map
            tab once one is open.
          </Alert>
        )}
        {puzzle && !loading && (
          <EditorPanels puzzleSelected={puzzle} pieces={pieces} />
        )}
      </Container>
    </React.Fragment>
  );
}

export default App;
