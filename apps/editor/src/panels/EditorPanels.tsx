import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { LoadingDialog } from "@mappuzzle/core";
import { PieceList } from "@mappuzzle/core";
import type { PieceProps } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import EditMap from "./editMap";
import type { Puzzles } from "@mappuzzle/shared";
import { Tab, Tabs } from "react-bootstrap";
import EditPiece from "./editPiece";
import "./EditorPanels.css";
import { AlertMessage } from "@mappuzzle/core";
import { ConfigService } from "@mappuzzle/core";
import NewMap from "./newMap";
import { BackMapEditorService } from "../services/BackMapEditorService";

interface EditorPanelsProps {
  puzzleSelected: Puzzles;
  pieces: PieceProps[];
}

/**
 * The editor's panels, rendered in the page.
 *
 * This was a modal, because the editor lived inside the game and had to sit on
 * top of it. Now that it is the page, the dialog chrome only got in the way, so
 * the show/onHide plumbing and the footer's Ok button are gone.
 */
function EditorPanels({
  puzzleSelected = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: EditorPanelsProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [pieceSelected, setPieceSelected] = useState(-1);
  const [pieceSelectedData, setPieceSelectedData] = useState({} as PieceProps);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);

  const clearAlert = () => {
    setAlert({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  /* Piece is selected on list */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPieceSelectedHandler = async (val: any) => {
    selectPiece(parseInt(val.target.parentNode.id));
  };

  /* Piece is selected on list */
  const selectPiece = async (pieceId: number) => {
    let piece = pieces.find(
      (p: PieceProps) => p.properties.cartodb_id === pieceId
    );
    if (piece) {
      piece.id = puzzleSelected.id;
      piece = await BackMapEditorService.updatePieceProps(piece);
      setPieceSelectedData(piece);
      setPieceSelected(pieceId);
    }
  };

  const handleSiteMap = () => {
    BackMapEditorService.generateSitemap()
      .then(() => {
        setAlert({
          title: "Success",
          message: "Sitemap generated",
          type: "success",
        } as AlertModel);
        setShowAlert(true);
      })
      .catch((err) => {
        setAlert({
          title: "Error",
          message: "Error generating sitemap" + err.message,
          type: "danger",
        } as AlertModel);
        setShowAlert(true);
      });
  };

  //onPieceUpHandler
  const onPieceUpHandler = () => {
    //find pieceSelected piece index
    const pieceIndex = pieces.findIndex(
      (p: PieceProps) => p.properties.cartodb_id === pieceSelected
    );
    if (pieceIndex > 0) {
      selectPiece(pieces[pieceIndex - 1].properties.cartodb_id);
    }
  };

  //onPieceDownHandler
  const onPieceDownHandler = () => {
    //find pieceSelected piece index
    const pieceIndex = pieces.findIndex(
      (p: PieceProps) => p.properties.cartodb_id === pieceSelected
    );
    if (pieceIndex < pieces.length - 1) {
      selectPiece(pieces[pieceIndex + 1].properties.cartodb_id);
    }
  };

  if (loading) return <LoadingDialog show={loading} delay={1000} />;
  return !puzzleSelected ? null : (
    <React.Fragment>
      <AlertMessage show={showAlert} alertMessage={alert} onHide={clearAlert} />
      <div className="editor-panels">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">{puzzleSelected.name}</h4>
          <Button variant="outline-secondary" onClick={handleSiteMap}>
            Generate Sitemap
          </Button>
        </div>
          {/* mountOnEnter so New Map only queries PostGIS when its tab is
              opened: react-bootstrap renders every pane otherwise, and that
              call used to bring the whole API down when PostGIS was off. */}
          <Tabs
            defaultActiveKey="pieces"
            id="editor-tabs"
            className="mb-3"
            mountOnEnter
          >
            <Tab eventKey="newMap" title="New Map">
              <Row>
                <NewMap />
              </Row>
            </Tab>
            <Tab eventKey="puzzle" title="Puzzle">
              <Row>
                <EditMap puzzle={puzzleSelected} pieces={pieces} />
              </Row>
            </Tab>
            <Tab eventKey="pieces" title="Pieces">
              <Row>
                <Col xs={4} lg={4} style={{ padding: "0px" }}>
                  <div
                    style={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 300px)",
                    }}
                  >
                    <PieceList
                      pieces={pieces}
                      founds={[]}
                      onPieceSelected={onPieceSelectedHandler}
                      pieceSelected={pieceSelected}
                      handleUp={onPieceUpHandler}
                      handleDown={onPieceDownHandler}
                      puzzleId={puzzleSelected.id}
                      lang={ConfigService.defaultLang}
                      enableFlags={
                        puzzleSelected.enableFlags
                          ? puzzleSelected.enableFlags
                          : false
                      }
                    />
                  </div>
                </Col>
                <Col xs={8} lg={8}>
                  <EditPiece piece={pieceSelectedData} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
      </div>
    </React.Fragment>
  );
}
export default EditorPanels;
