import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import "../i18n/config";
import { useTranslation } from "react-i18next";

import { getUrl } from "../lib/Utils";
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
  const { t } = useTranslation();

  useEffect(() => {
    PuzzleService.getPuzzles().then((data) => {
      setContent(data);
    });
    setShowIn(show);
  }, [show]);

  function handleClose() {
    InfoClose();
  }

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
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {t("common.share.title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col lg={12} className="info">
              <p>
                MapPuzzle.gl is an experimental website, developed with React
                and Deck.gl. It is an accessible way to learn cartography,
                through this project I try to offer an interactive learning
                experience with maps.
              </p>
              <h2>Description of the game</h2>
              <p>
                MapPuzzle.xyz is a fun way to learn geography in a playful way.
                The game features a list of puzzle pieces on the left side of
                the screen, which can be countries, states, cities, or
                provinces, among others. Each piece is shown with a map
                illustration and when clicked, it follows the mouse and the
                player must find its match on the map. It also has a counter for
                found pieces, pieces to be found, and mistakes made. Players can
                choose the map they want to play and filter it by continent and
                region.
              </p>
              <p>
                One of the interesting features of the game is that it allows
                players to translate the names of the puzzle pieces into
                different languages. This allows them to learn the names of the
                places in different languages, enriching their gaming experience
                and helping them develop their language skills.
              </p>
              <p>
                In addition, every time a piece is placed on the map, players
                can access Wikipedia data about the place they are exploring.
                This allows them to obtain additional information about the
                geography, history, culture, and other areas related to the
                place, helping them learn more about the world around them.
              </p>
              <p>
                In summary, the map puzzle game offers a complete and fun
                educational experience for all ages. Don&apos;t miss out on
                trying it!
              </p>
              <h2>Code description</h2>
              <p>
                To develop the game, the Deck.gl library was used, which allows
                creating interactive maps on the web using JavaScript and WebGL.
                This library is a powerful and versatile tool that facilitates
                the development of map applications on the web, offering a wide
                variety of components and layers that can be used to create
                custom and highly interactive maps.
              </p>

              <p>
                In addition, other technologies and tools such as React, sqlite,
                PHP, typeorm, and node.js have been used to implement different
                functionalities and improve the game experience. React has been
                used as a user interface development framework, sqlite has been
                used to store and retrieve data in a local database, PHP has
                been used to develop server scripts, typeorm has been used to
                manage the database, and node.js has been used as an execution
                environment to run the server scripts.
              </p>

              <p>
                In terms of the project structure, the game is divided into
                different components and modules that are responsible for
                different tasks. For example, there are components that are
                responsible for displaying the puzzle piece list and the map,
                others that manage the game logic and interact with players, and
                others that are responsible for obtaining and processing
                Wikipedia and translation data.
              </p>

              <p>
                In summary, the map puzzle game has been developed using
                advanced technologies and web development tools, and is
                structured in a modular and efficient way to facilitate its
                maintenance and expansion.
              </p>
              <h2>Credits</h2>
              {infoPuzzles}

              <p>
                The project repository can be found at:&nbsp;
                <a
                  href="https://github.com/alexwing/MapPuzzle.gl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/alexwing/MapPuzzle.gl
                </a>
              </p>
              <p>
                If you want to support the project, you can donate at this
                link:&nbsp;
                <a
                  href="https://github.com/sponsors/alexwing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/sponsors/alexwing
                </a>
              </p>
              <p>
                More info in:&nbsp;
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
          <Button onClick={handleClose}>Ok</Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default Info;
