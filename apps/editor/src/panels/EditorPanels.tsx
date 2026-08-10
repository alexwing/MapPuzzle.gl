import React, { useState, useEffect } from "react";
import { LoadingDialog } from "@mappuzzle/core";
import { PieceList } from "@mappuzzle/core";
import type { PieceProps } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import EditMap from "./editMap";
import type { Puzzles } from "@mappuzzle/shared";
import { Nav, Tab } from "react-bootstrap";
import EditPiece from "./editPiece";
import "./EditorPanels.css";
import { BackMapEditorService } from "../services/BackMapEditorService";
import { AlertMessage } from "@mappuzzle/core";
import { ConfigService } from "@mappuzzle/core";

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
        {/* Tab.Container instead of Tabs so the nav can share a row with the
            puzzle name: the title used to own a line of its own above them. */}
        <Tab.Container defaultActiveKey="pieces" mountOnEnter>
          <div className="editor-header">
            <h5 className="mb-0 text-truncate">{puzzleSelected.name}</h5>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="puzzle">Puzzle settings</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pieces">Pieces</Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <Tab.Content className="editor-content">
            <Tab.Pane eventKey="puzzle" className="editor-pane-scroll">
              <EditMap puzzle={puzzleSelected} pieces={pieces} />
            </Tab.Pane>
            <Tab.Pane eventKey="pieces" className="editor-pane-split">
              {/* Two independently scrolling columns that fill whatever height
                  is left, rather than guessing it with calc(100vh - 300px). */}
              <div className="editor-piece-list">
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
              <div className="editor-piece-detail">
                <EditPiece piece={pieceSelectedData} />
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </React.Fragment>
  );
}
export default EditorPanels;
