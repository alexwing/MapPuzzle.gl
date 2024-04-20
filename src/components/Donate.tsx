import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "../i18n/config";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import { getLang } from "../lib/Utils";
import { Check, Heart, HeartFill } from "react-bootstrap-icons";
import { PuzzleService } from "../services/puzzleService";
import Puzzles from "../../backend/src/models/puzzles";

function Info(): JSX.Element | null {
  const [showIn, setShowIn] = useState(false);
  const [content, setContent] = useState([] as Puzzles[]);
  const [markdown, setMarkdown] = useState("");
  const { t } = useTranslation();

  function handleClose() {
    setShowIn(false);
  }

  useEffect(() => {
    if (!showIn) {
      return;
    }
    const lang = getLang() === "es" ? "ES" : "EN";
    console.log("lang service", getLang());
    console.log("lang", lang);
    PuzzleService.getResource(`/doc/donate${lang}.md`).then((response) => {
      setMarkdown(response);
    });
  }, [showIn]);

  return !content ? null : (
    <React.Fragment>
      <Button
        onClick={() => setShowIn(true)}
        rel="noreferrer"
        variant="outline-danger"
        size="sm"
        className="donateButton"
      >
        <Heart size={22} className="me-2" />
        {t("common.donate")}
      </Button>
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
        className="infoModal"
      >
        <Modal.Body className="info">
          <Row>
            <Col lg={12}>
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            href="https://github.com/sponsors/alexwing"
            target="_blank"
            rel="noreferrer"
            variant="danger"
            style={{ position: "absolute", left: "20px" }}
          >
            <Heart size={22} className="me-2" />
            {t("common.donate")}
          </Button>
          <Button onClick={handleClose}>
            <Check size={22} className="me-2" />
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default Info;
