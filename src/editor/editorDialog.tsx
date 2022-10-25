import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import LoadingDialog from "../components/LoadingDialog";
import PieceList from "../components/PieceList";
import { AlertModel, PieceProps } from "../models/Interfaces";
import EditMap from "./editMap";
import Puzzles from "../../backend/src/models/puzzles";
import { Tab, Tabs } from "react-bootstrap";
import { PuzzleService } from "../services/puzzleService";
import EditPiece from "./editPiece";
import "./editorDialog.css";
import AlertMessage from "../components/AlertMessage";

interface EditorDialogProps {
  show: boolean;
  onHide: (val: boolean) => void;
  puzzleSelected: Puzzles;
  pieces: PieceProps[];
}

function EditorDialog({
  show = false,
  onHide,
  puzzleSelected = {} as Puzzles,
  pieces = new Array<PieceProps>(),
}: EditorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
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

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //is showing modal
  useEffect(() => {
    if (showIn) {
      setLoading(false);
    }
  }, [showIn, puzzleSelected]);

  /* Piece is selected on list */
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
      piece = await PuzzleService.updatePieceProps(piece);
      setPieceSelectedData(piece);
      setPieceSelected(pieceId);
    }
  };

  const handleClose = () => {
    onHide(false);
  };

  const handleSiteMap = () => {
    PuzzleService.generateSitemap()
      .then((res) => {
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
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
        className="editor-dialog"
        backdropClassName="editor-dialog-backdrop"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {puzzleSelected.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            defaultActiveKey="pieces"
            id="uncontrolled-tab-example"
            className="mb-3"
          >
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
                      lang={"en"}                    
                      />
                  </div>
                </Col>
                <Col xs={8} lg={8}>
                  <EditPiece piece={pieceSelectedData} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleSiteMap}
            style={{ marginRight: "auto" }}
          >
            Generate Sitemap
          </Button>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default EditorDialog;
