import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./WikiInfo.css";
import { changeLanguage, getWikiInfo } from "../services/wikiService";
import { AlertModel, WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { Nav, NavDropdown } from "react-bootstrap";
import LoadingDialog from "./LoadingDialog";
import { getCookie, setCookie } from "react-simple-cookie-store";
import { ConfigService } from "../services/configService";
import AlertMessage from "./AlertMessage";

function WikiInfo({ show = false, onHide, url = "Berlin", id = -1 }: any) {
  const [pieceInfo, setPieceInfo] = useState({
    title: "",
    contents: [],
    langs: [],
  } as WikiInfoPiece);

  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);

  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //is showing modal
  useEffect(() => {
    if (showIn && url !== "") {
      setLoading(true);
      getWikiInfo(url)
        .then((wikiInfo: WikiInfoPiece) => {
          if (wikiInfo.title === "Not found data on Wikipedia") {
            setShowAlert(true);
            setAlert({
              title: "Not found data on Wikipedia",
              message: wikiInfo.title,
              type: "danger",
            } as AlertModel);
          }
          setPieceInfo(wikiInfo);
        })
        .catch((errorRecived: any) => {
          setShowAlert(true);
          setAlert({
            title: "Not found data on Wikipedia",
            message: errorRecived.message,
            type: "danger",
          } as AlertModel);
          setPieceInfo({
            title: "Not found data on Wikipedia",
            contents: [errorRecived.message],
            langs: [],
          } as WikiInfoPiece);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [showIn, url]);

  const langName = (piece: WikiInfoLang) => {
    if (piece.autonym === "") {
      return piece.langname;
    } else {
      if (piece.autonym === piece.langname) {
        return piece.langname;
      } else {
        return piece.langname + " (" + piece.autonym + ")";
      }
    }
  };
  const currentLang = () => {
    const puzzleLanguage = getCookie("puzzleLanguage") || "en";
    //find in pieceInfo.langs the lang with the same lang as puzzleLanguage
    const pieceLang = pieceInfo.langs.find(
      (x: any) => x.lang === puzzleLanguage
    );
    if (typeof pieceLang === "object" && pieceLang !== null) {
      return langName(pieceLang);
    } else {
      return "";
    }
  };

  const navDropdownTitle = (
    <span>
      <span className="lang-selector-icon"></span>
      <span className="d-none d-lg-inline d-lg-none">{currentLang()}</span>
    </span>
  );
  const pieceLangs = (
    <Nav>
      <NavDropdown
        className="lang-selector"
        title={navDropdownTitle}
        id="puzzle"
      >
        {pieceInfo.langs.map((c: any) => (
          <NavDropdown.Item id={c.lang} key={c.lang} onClick={onSelectLang}>
            {langName(c)}
          </NavDropdown.Item>
        ))}
      </NavDropdown>
    </Nav>
  );

  function onSelectLang(e: any) {
    const lang = e.target.id;
    changeLanguage(pieceInfo, lang)
      .then((extract) => {
        const newPieceInfo = { ...pieceInfo };
        newPieceInfo.contents = extract;
        setCookie("puzzleLanguage", lang, ConfigService.cookieDays);
        setPieceInfo(newPieceInfo);
      })
      .catch((errorRecived: any) => {
        setShowAlert(true);
        setAlert({
          title: "Not found data on Wikipedia",
          message: errorRecived.message,
          type: "danger",
        } as AlertModel);
        setPieceInfo({
          title: "Not found data on Wikipedia",
          contents: [errorRecived.message],
          langs: [],
        } as WikiInfoPiece);
      });
  }

  function handleClose() {
    clearAlert();
    onHide();
  }
  const wikiTitle = () => {
    if (pieceInfo.title !== "") {
      return (
        <span>
          <span className="d-none d-lg-inline d-lg-none">
            Wikipedia article for{" "}
          </span>
          {pieceInfo.title}
        </span>
      );
    } else {
      return <span>"Not found data on Wikipedia"</span>;
    }
  };

  const clearAlert = () => {
    setAlert({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  if (loading) return <LoadingDialog show={loading} delay={1000} />;
  return (
    <React.Fragment>
     <AlertMessage show={showAlert} alertMessage={alert} onHide={clearAlert} />
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {wikiTitle()}
          </Modal.Title>
          {pieceLangs}
        </Modal.Header>
        <Modal.Body>
          <Row>{printContent()}</Row>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Body id="contained-modal-title-vcenter">
            <small>
              This article uses material from the Wikipedia article{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href={"https://en.wikipedia.org/wiki/" + pieceInfo.title}
              >
                {pieceInfo.title}
              </a>
              , which is released under the{" "}
              <a href="https://creativecommons.org/licenses/by-sa/3.0/">
                Creative Commons Attribution-Share-Alike License 3.0
              </a>
              .
            </small>
          </Modal.Body>
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
        {pieceInfo.contents.map((content, index: number) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
        ))}
      </Col>
    );
  }
}
export default WikiInfo;
