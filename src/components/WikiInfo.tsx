import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./WikiInfo.css";
import { changeLanguage, getWikiInfo } from "../services/wikiService";
import { AlertModel, WikiInfoPiece } from "../models/Interfaces";
import LoadingDialog from "./LoadingDialog";
import { setCookie, getCookie } from "react-simple-cookie-store";
import { ConfigService } from "../services/configService";
import AlertMessage from "./AlertMessage";
import LangSelector from "./LangSelector";
import { getCurrentLang } from "../lib/Utils";
import { PuzzleService } from "../services/puzzleService";


interface WikiInfoProps {
  show: boolean;
  onHide: (val:boolean) => void;
  url: string;
}


function WikiInfo({ show = false, onHide, url = "Berlin" }: WikiInfoProps) {
  const [pieceInfo, setPieceInfo] = useState({
    title: "",
    contents: [],
    langs: [],
  } as WikiInfoPiece);

  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentLang, setCurrentLang] = React.useState("");
  const [alertModal, setAlertModal] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [rtlClass, setRtlClass] = useState("");
  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);
  //on init load if rtl lang
  useEffect(() => {
    const puzzleLanguage =
      getCookie("puzzleLanguage") || ConfigService.defaultLang;
    PuzzleService.getLangIsRtl(puzzleLanguage)
      .then((isRtl) => {
        setRtlClass(isRtl ? "rtl" : "");
      })
      .catch((err) => {
        console.log(err);
        setRtlClass("");
      });
  }, [currentLang, showIn, url]);

  //is showing modal
  useEffect(() => {
    if (show && url !== "") {
      setLoading(true);
      getWikiInfo(url)
        .then((wikiInfo: WikiInfoPiece) => {
          if (wikiInfo.title === "Not found data on Wikipedia") {
            setAlertModal({
              title: "Not found data on Wikipedia",
              message: wikiInfo.title,
              type: "danger",
            } as AlertModel);
            setShowAlert(true);
            setShowIn(false);
          } else {
            setPieceInfo(wikiInfo);
            setCurrentLang(getCurrentLang(wikiInfo.langs));
            setShowAlert(false);
            setShowIn(true);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((errorRecived: any) => {
          setShowAlert(true);
          setAlertModal({
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
  }, [url, show]);

  function onSelectLang(e: MouseEvent) {
    if (e.target instanceof HTMLButtonElement) {
      const lang = e.target.id;
      changeLanguage(pieceInfo, lang)
        .then((extract) => {
          const newPieceInfo = { ...pieceInfo };
          newPieceInfo.contents = extract;
          setCookie("puzzleLanguage", lang, ConfigService.cookieDays);
          setPieceInfo(newPieceInfo);
          setCurrentLang(getCurrentLang(newPieceInfo.langs));
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((errorRecived: any) => {
          setShowAlert(true);
          setAlertModal({
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
  }

  function handleClose() {
    clearAlert();
    onHide(false);
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
      return <span>Not found data on Wikipedia</span>;
    }
  };

  const clearAlert = () => {
    setAlertModal({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  if (loading)
    return (
      <LoadingDialog
        show={loading}
        delay={1000}      
      />
    );
  const LangSelectorContainer = !ConfigService.langWikiSelector ? (
    ""
  ) : (
    <LangSelector
      langs={pieceInfo.langs}
      onSelectLang={onSelectLang}
      currentLang={currentLang}
    />
  );
  return (
    <React.Fragment>
      <AlertMessage
        show={showAlert}
        alertMessage={alertModal}
        onHide={clearAlert}
      />
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
          {LangSelectorContainer}
        </Modal.Header>
        <Modal.Body className={rtlClass}>
          <Row>{printContent()}</Row>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Body id="contained-modal-title-vcenter">
            <small>
              This article uses material from the Wikipedia article&nbsp;
              <a
                target="_blank"
                rel="noreferrer"
                href={"https://en.wikipedia.org/wiki/" + pieceInfo.title}
              >
                {pieceInfo.title}
              </a>
              , which is released under the&nbsp;
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
