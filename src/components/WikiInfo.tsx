import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./WikiInfo.css";
import { getWikiInfo } from "../services/wikiService";
import { WikiInfoPiece } from "../models/Interfaces";

function WikiInfo({ show = false, onHide, url = "Berlin" }: any) {
  const [pieceInfo, setPieceInfo] = useState({
    title: "",
    contents: [],
    langs: [],
  } as WikiInfoPiece);

  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [error, setError] = useState();

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //is showing modal
  useEffect(() => {
    if (showIn) {
      getContents();
    }
  }, [showIn]);

  const getContents = () => {
    setLoading(true);
    getWikiInfo(url)
      .then((wikiInfo: WikiInfoPiece) => {
        setPieceInfo(wikiInfo);
      })
      .catch((errorRecived: any) => {
        setError(errorRecived);
        debugger;
        setPieceInfo({
          title: "Not found data on Wikipedia",
          contents: [errorRecived.message],
          langs: [],
        } as WikiInfoPiece);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function handleClose() {
    onHide();
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return (
    <React.Fragment>
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {pieceInfo.title !== ""
              ? "Wikipedia article for " + pieceInfo.title
              : "Not found data on Wikipedia"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>{printContent()}</Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );

  function printContent() {
    if (pieceInfo.title === "") {
      return null;
    }
    return (
      <Col lg={12} className="infoWiki">
        {pieceInfo.contents.map((content) => (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ))}
      </Col>
    );
  }
}
export default WikiInfo;
