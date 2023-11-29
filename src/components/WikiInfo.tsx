import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "./WikiInfo.css";
import { changeLanguage, getWikiInfo } from "../services/wikiService";
import { AlertModel, WikiInfoPiece } from "../models/Interfaces";
import LoadingDialog from "./LoadingDialog";
import { setCookie } from "react-simple-cookie-store";
import { ConfigService } from "../services/configService";
import AlertMessage from "./AlertMessage";
import LangSelector from "./LangSelector";
import { Wikipedia, Check } from "react-bootstrap-icons";

import {
  getCurrentLang,
  getTitleFromLang,
  cleanWikiComment,
  getLang,
} from "../lib/Utils";
import { PuzzleService } from "../services/puzzleService";
import "../i18n/config";
import { useTranslation } from "react-i18next";

interface WikiInfoProps {
  show: boolean;
  onHide: (val: boolean) => void;
  url: string;
  piece: number;
  enableFlags?: boolean;
  puzzleSelected?: number;
}

function WikiInfo({
  show = false,
  onHide,
  url = "Berlin",
  piece,
  enableFlags = false,
  puzzleSelected = 0,
}: WikiInfoProps): JSX.Element {
  const [pieceInfo, setPieceInfo] = useState({
    title: "",
    contents: [],
    langs: [],
  } as WikiInfoPiece);

  const [loading, setLoading] = useState(false);
  const [showIn, setShowIn] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentLang, setCurrentLang] = React.useState("");
  const [titleLang, setTitleLang] = React.useState("");
  const [alertModal, setAlertModal] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);
  const [rtlClass, setRtlClass] = useState("");
  const { t } = useTranslation();
  //on load show modal
  useEffect(() => {
    setShowIn(show);
  }, [show]);
  //on init load if rtl lang
  useEffect(() => {
    const puzzleLanguage = getLang();
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
              title: t("wikiInfo.notFound"),
              message: wikiInfo.title,
              type: "danger",
            } as AlertModel);
            setShowAlert(true);
            setShowIn(false);
          } else {
            setPieceInfo(wikiInfo);
            setCurrentLang(getCurrentLang(wikiInfo.langs));
            const title = getTitleFromLang(wikiInfo.langs);
            if (title !== "") {
              setTitleLang(title);
            } else {
              setTitleLang(wikiInfo.title);
            }
            //find name wiki
            setShowAlert(false);
            setShowIn(true);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((errorRecived: any) => {
          setShowAlert(true);
          setAlertModal({
            title: t("wikiInfo.notFound"),
            message: errorRecived.message,
            type: "danger",
          } as AlertModel);
          setPieceInfo({
            title: t("wikiInfo.notFound"),
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
            title: t("wikiInfo.notFound"),
            message: errorRecived.message,
            type: "danger",
          } as AlertModel);
          setPieceInfo({
            title: t("wikiInfo.notFound"),
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
          <Wikipedia size={28} className="me-2" />
          {titleLang}
        </span>
      );
    } else {
      return <span>{t("wikiInfo.notFound")}</span>;
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

  if (loading) return <LoadingDialog show={loading} delay={1000} />;
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
        className="alertWiki"
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
          <Button onClick={handleClose}>
            <Check size={22} className="me-2" />
            Ok
          </Button>
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
        {!enableFlags &&
          pieceInfo.image !== undefined &&
          pieceInfo.image !== "" && (
            <img
              src={pieceInfo.image}
              alt={pieceInfo.title}
              className="imgWiki"
            />
          )}
        {enableFlags && (
          <img
            src={`../customFlags/${puzzleSelected.toString()}/512/${piece.toString()}.png`}
            alt={currentLang}
            className="imgWiki"
          />
        )}
        {cleanWikiComment(pieceInfo.contents).map((content, index: number) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
        ))}
      </Col>
    );
  }
}
export default WikiInfo;
