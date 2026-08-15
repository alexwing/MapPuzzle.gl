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

function selectedMapFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("map") ?? "";
}

function pushSelectedMap(mapUrl: string): void {
  const next = new URL(window.location.href);
  if (mapUrl) {
    next.searchParams.set("map", mapUrl);
  } else {
    next.searchParams.delete("map");
  }
  window.history.replaceState({}, "", `${next.pathname}?${next.searchParams.toString()}`.replace(/\?$/, ""));
}

function App(): JSX.Element {
  const [puzzles, setPuzzles] = useState([] as Puzzles[]);
  const [puzzle, setPuzzle] = useState<Puzzles | null>(null);
  const [pieces, setPieces] = useState([] as PieceProps[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [notice, setNotice] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPuzzles = puzzles.filter((p) =>
    p.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const onSelectPuzzle = (id: number) => {
    loadPuzzle(id);
    setSearchInput("");
    setShowDropdown(false);
  };

  /**
   * Rebuilds the share card for every puzzle: what a link to it looks like when
   * someone pastes it into a chat. A hundred and nineteen images, so unlike the
   * sitemap it says where it has got to while it works.
   */
  const generateOgImages = () => {
    setNotice("Building share cards…");
    BackMapEditorService.generateOgImages((p) =>
      setNotice(`Building share cards… ${p.done} of ${p.total} — ${p.label}`)
    )
      .then((res) => setNotice(res?.msg ?? "Share cards rebuilt"))
      .catch((e) => setNotice(`Could not build the share cards: ${String(e)}`));
  };

  /**
   * Measures every piece of every puzzle: where its centre is, how big it is
   * and what it borders. Nothing reads it yet; the games being planned do.
   */
  const enrichPieces = () => {
    setNotice("Measuring pieces…");
    BackMapEditorService.enrichPieces((p) =>
      setNotice(`Measuring pieces… ${p.done} of ${p.total} — ${p.label}`)
    )
      .then((res) => setNotice(res?.msg ?? "Pieces measured"))
      .catch((e) => setNotice(`Could not measure the pieces: ${String(e)}`));
  };

  const loadPuzzles = () => {
    PuzzleService.getPuzzles()
      .then((list) => {
        setPuzzles(list);
        const wanted = selectedMapFromUrl();
        if (!wanted) return;
        const hit = list.find((p) => p.url === wanted);
        if (hit) {
          loadPuzzle(hit.id);
        }
      })
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
      pushSelectedMap(selected.url);
    } catch (err) {
      setError(`Could not load the puzzle: ${String(err)}`);
      setPuzzle(null);
      pushSelectedMap("");
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

          <ButtonGroup className="ms-auto">
            <Button size="sm" variant="outline-light" onClick={generateOgImages}>
              Build share cards
            </Button>
            <Button size="sm" variant="outline-light" onClick={enrichPieces}>
              Measure pieces
            </Button>
          </ButtonGroup>

          {mode === "edit" && (
            <div style={{ position: "relative", maxWidth: "22rem" }}>
              <Form.Control
                type="text"
                placeholder="Search puzzle by name…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {showDropdown && filteredPuzzles.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #ced4da",
                    borderTop: "none",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {filteredPuzzles.slice(0, 50).map((option) => (
                    <div
                      key={option.id}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        background:
                          puzzle?.id === option.id
                            ? "#e7f3ff"
                            : "transparent",
                      }}
                      onMouseDown={() => onSelectPuzzle(option.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f0f0f0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          puzzle?.id === option.id ? "#e7f3ff" : "transparent";
                      }}
                    >
                      {option.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
