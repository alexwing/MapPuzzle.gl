import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Fireworks from "../lib/Fireworks";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";

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
}: YouWinProps) : JSX.Element | null {
  const [show, setShow] = React.useState(true);

  const handleClose = () => {
    setShow(false);
  };

  useEffect(() => {
    if (winner) {
      setShow(true);
    }
  }, [winner]);

  const url = "http://" + getUrl() + "/?map=" + path;
  const quote =
    "I completed the puzzle game of the " +
    name +
    ", in " +
    getTexTime() +
    ", with " +
    fails +
    " failures out of " +
    founds.length +
    " pieces found.";
  const hashtag = "education,cartography,puzzle,countries";
  const title = "MapPuzzle.xyz - Puzzle game based in maps";
  return !winner ? null : (
    <React.Fragment>
      <Modal
        show={show}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Congratulations! You&apos;re done.
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="scorewin">
            <Col xs={4} lg={4}>
              <Alert variant="success">
                <Alert.Heading>Founds:</Alert.Heading>
                <hr />
                <p className="mb-0">{founds.length}</p>
              </Alert>
            </Col>
            <Col xs={4} lg={4}>
              <Alert variant="warning">
                <Alert.Heading>Time:</Alert.Heading>
                <hr />
                <p className="mb-0">{getTime()}</p>
              </Alert>
            </Col>
            <Col xs={4} lg={4}>
              <Alert variant="danger">
                <Alert.Heading>Fails:</Alert.Heading>
                <hr />
                <p className="mb-0">{fails}</p>
              </Alert>
            </Col>
          </Row>
          <Row>
            <Col lg={12} className="share">
              <h4>Share your score</h4>
              <EmailShareButton url={url} subject={title} body={quote}>
                <EmailIcon size={48} round={true} />
              </EmailShareButton>
              <FacebookShareButton url={url} quote={quote} hashtag={hashtag}>
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
          <Button variant="outline-primary" onClick={handleClose}>
            Explore
          </Button>
          <Button onClick={onResetGame}>New Game</Button>
        </Modal.Footer>
      </Modal>
      {show && <Fireworks />}
    </React.Fragment>
  );
}
