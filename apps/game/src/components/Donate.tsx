import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "../i18n/config";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import { Check, Heart } from "react-bootstrap-icons";
import { PuzzleService } from "@mappuzzle/core";

function Info(): JSX.Element | null {
  const [showIn, setShowIn] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const { t, i18n } = useTranslation();

  function handleClose() {
    setShowIn(false);
  }

  useEffect(() => {
    if (!showIn) {
      return;
    }
    // The language on screen, not the one in the cookie. Since addresses
    // carry a language — /es/map/... asks for Spanish whatever this browser
    // last chose — the two can disagree, and they did: a Spanish page opened
    // this dialog in English. i18n.language is what the interface is actually
    // speaking. Only ES and EN of these documents exist; the other five
    // languages fall back to English on purpose.
    const lang = i18n.language === "es" ? "ES" : "EN";
    PuzzleService.getResource(`/doc/donate${lang}.md`).then((response) => {
      setMarkdown(response);
    });
  }, [showIn]);

  return  (
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
