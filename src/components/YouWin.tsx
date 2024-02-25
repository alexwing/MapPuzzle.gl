import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Fireworks from "../lib/Fireworks";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";
import "../i18n/config";
import { useTranslation } from "react-i18next";
import * as Icon from "react-bootstrap-icons";

import { getUrl, getTexTime, getTime } from "../lib/Utils";
import "./YouWin.css";
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

interface YouWinProps {
  founds: Array<number>;
  fails: number;
  onResetGame: () => void;
  path: string;
  name: string;
  winner: boolean;
}

export default function YouWin({
  founds,
  fails,
  onResetGame,
  path,
  name,
  winner = false,
}: YouWinProps): JSX.Element | null {
  const [show, setShow] = React.useState(true);
  const { t } = useTranslation();

  const handleClose = () => {
    setShow(false);
  };

  useEffect(() => {
    if (winner) {
      setShow(true);
    }
  }, [winner]);

  const url = "http://" + getUrl() + "/?map=" + path;
  const quote = t("common.share.quote", {
    name,
    time: getTexTime(t),
    fails,
    founds: founds.length,
  });
  const hashtag = t("common.share.hashtag");
  const title = t("common.share.title");
  return !winner ? null : (
    <React.Fragment>
      <Modal
        show={show}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
        className="youWin"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {t("YouWin.title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="scorewin">
            <Col xs={4} lg={4}>
              <Alert variant="success">
                <Alert.Heading>{t("YouWin.founds")}</Alert.Heading>
                <hr />
                <p className="mb-0">{founds.length}</p>
              </Alert>
            </Col>
            <Col xs={4} lg={4}>
              <Alert variant="warning">
                <Alert.Heading>{t("YouWin.time")}</Alert.Heading>
                <hr />
                <p className="mb-0">{getTime(t)}</p>
              </Alert>
            </Col>
            <Col xs={4} lg={4}>
              <Alert variant="danger">
                <Alert.Heading>{t("YouWin.fails")}</Alert.Heading>
                <hr />
                <p className="mb-0">{fails}</p>
              </Alert>
            </Col>
          </Row>
          <Row>
            <Col lg={12} className="share">
              <h4>{t("YouWin.share")}</h4>
              <EmailShareButton url={url} subject={title} body={quote} className="me-2">
                <EmailIcon size={48} round={true} />
              </EmailShareButton>
              <FacebookShareButton url={url} hashtag={hashtag} className="me-2">
                <FacebookIcon size={48} round={true} />
              </FacebookShareButton>
              <TwitterShareButton
                url={url}
                title={quote}
                hashtags={hashtag.split(",")}
                className="me-2">
                <TwitterIcon size={48} round={true} />
              </TwitterShareButton>
              <LinkedinShareButton
                url={url}
                title={title + " - " + name}
                summary={quote}
                source={title}
                className="me-2">
                <LinkedinIcon size={48} round={true} />
              </LinkedinShareButton>
              <WhatsappShareButton url={url} title={quote}  className="me-2">
                <WhatsappIcon size={48} round={true} />
              </WhatsappShareButton>
              <TelegramShareButton url={url} title={quote}  className="me-2">
                <TelegramIcon size={48} round={true} />
              </TelegramShareButton>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={handleClose}
            size="lg"
            className="mb-4"
          >
            <Icon.Globe size={28} className="me-2" />
            {t("YouWin.buttons.explore")}
          </Button>
          <Button onClick={onResetGame} size="lg" className="mb-4">
            <Icon.Play size={28} className="me-2" />
            {t("YouWin.buttons.playAgain")}
          </Button>
        </Modal.Footer>
      </Modal>
      {show && <Fireworks />}
    </React.Fragment>
  );
}
