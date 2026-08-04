import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import "../i18n/config";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import { getLang } from "../lib/Utils";
import { Check } from "react-bootstrap-icons";
import { PuzzleService } from "../services/puzzleService";

interface PrivacyProps {
  showIn: boolean;
  setShowIn: (show: boolean) => void;
}

function Privacy({ showIn, setShowIn }: PrivacyProps): JSX.Element | null {
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
    PuzzleService.getResource(`/doc/privacy${lang}.md`).then((response) => {
      setMarkdown(response);
    });
  }, [showIn]);

  return (
    <React.Fragment>
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
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose}>
            <Check size={22} className="me-2" />
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default Privacy;
