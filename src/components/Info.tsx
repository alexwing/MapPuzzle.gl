import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import "../i18n/config";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import { getLang, getUrl } from "../lib/Utils";
import { Check, Heart, ShieldShaded, Github } from "react-bootstrap-icons";
import "./Info.css";
import {
  FacebookShareButton,
  FacebookIcon,
  EmailShareButton,
  EmailIcon,
  TwitterShareButton,
  TwitterIcon,
  LinkedinShareButton,
  LinkedinIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
} from "react-share";
import { PuzzleService } from "../services/puzzleService";
import Puzzles from "../../backend/src/models/puzzles";
import Privacy from "./Privacy";
//to function hooks

interface InfoProps {
  show: boolean;
  InfoClose: () => void;
  name: string;
}

function Info({
  show = false,
  InfoClose,
  name,
}: InfoProps): JSX.Element | null {
  const [showIn, setShowIn] = useState(false);
  const [content, setContent] = useState([] as Puzzles[]);
  const [markdown, setMarkdown] = useState("");
  const { t } = useTranslation();
  const [showInPrivacy, setShowInPrivacy] = useState(false);

  useEffect(() => {
    PuzzleService.getPuzzles().then((data) => {
      setContent(data);
    });
    setShowIn(show);
  }, [show]);

  function handleClose() {
    InfoClose();
  }

  useEffect(() => {
    if (!showIn) {
      return;
    }
    const lang = getLang() === "es" ? "ES" : "EN";
    console.log("lang service", getLang());
    console.log("lang", lang);
    PuzzleService.getResource(`/doc/about${lang}.md`).then((response) => {
      setMarkdown(response);
    });
  }, [showIn]);

  const url = "http://" + getUrl();
  const quote = t("info.quote");
  const hashtag = t("common.share.hashtag");
  const title = t("common.share.title");
  const infoPuzzles = !content ? null : (
    <Table striped bordered size="sm" className="legendInfo">
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">Map</th>
          <th scope="col">Credits</th>
        </tr>
      </thead>
      <tbody>
        {content.map((c: Puzzles) => (
          <tr key={c.id} id={c.id.toString()}>
            <td width="1%">
              <img src={c.icon} alt={c.name} />
            </td>
            <td width="30%">{c.name}</td>
            <td width="50%">
              <a href={c.comment} target="_blank" rel="noopener noreferrer">
                {c.comment}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
  return !content ? null : (
    <React.Fragment>
      <Privacy showIn={showInPrivacy} setShowIn={setShowInPrivacy} />
      <Modal
        show={showIn && !showInPrivacy}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
        className="infoModal"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {t("common.share.title")} <span className="hide-xs d-none d-sm-inline"> - {t("common.share.subtitle")}</span>
            <a
              rel="noreferrer"
              style={{ position: "absolute", right: "20px" }}
              onClick={() => setShowInPrivacy(true)}
            >
              <ShieldShaded size={22} className="me-2" />
              {t("common.privacy")}
            </a>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="info">
          <Row>
            <Col lg={12}>
              <ReactMarkdown>{markdown}</ReactMarkdown>
              {infoPuzzles}
              <p>
               {t("info.github")}:&nbsp;
                <a
                  href="https://github.com/alexwing/MapPuzzle.gl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/alexwing/MapPuzzle.gl
                </a>
              </p>
              <p>
              {t("info.moreInfo")}:&nbsp;
                <a
                  href="https://aaranda.es/en/mappuzzle-gl-en/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  aaranda.es
                </a>
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={12} className="share">
              <h4>{t("info.share")}</h4>
              <EmailShareButton url={url} subject={title} body={quote}>
                <EmailIcon size={48} round={true} />
              </EmailShareButton>
              <FacebookShareButton url={url} hashtag={hashtag}>
                <FacebookIcon size={48} round={true} />
              </FacebookShareButton>
              <TwitterShareButton
                url={url}
                title={quote}
                hashtags={hashtag.split(",")}
              >
                <TwitterIcon size={48} round={true} />
              </TwitterShareButton>
              <LinkedinShareButton
                url={url}
                title={title + " - " + name}
                summary={quote}
                source={title}
              >
                <LinkedinIcon size={48} round={true} />
              </LinkedinShareButton>
              <WhatsappShareButton url={url} title={quote}>
                <WhatsappIcon size={48} round={true} />
              </WhatsappShareButton>
              <TelegramShareButton url={url} title={quote}>
                <TelegramIcon size={48} round={true} />
              </TelegramShareButton>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ position: "absolute", left: "20px" }}>
            <Button
              href="https://github.com/sponsors/alexwing"
              target="_blank"
              rel="noreferrer"
              variant="danger"
            >
              <Heart size={22} className="me-2" />
              {t("common.donate")}
            </Button>
            <Button
              href="https://github.com/alexwing/MapPuzzle.gl"
              target="_blank"
              rel="noopener noreferrer"
              variant="none"
              className="ms-2"
            >
              <Github size={22} className="me-2" />
              Github
            </Button>
          </div>
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
