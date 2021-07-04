import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";

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

export default class Info extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      show: false,
    };
  }
  componentWillReceiveProps(nextProps: any) {
    this.setState({ show: nextProps.show });
  }
  render() {
    const { InfoClose } = this.props;
    const handleClose = () => {
      this.setState({
        show: false,
      });
      InfoClose();
    };
    const url = "http://" + getUrl();
    const quote =
      "MapPuzzle.gl is an experimental website, it is an accessible way to learn cartography, through this project we try to offer an interactive learning experience with maps.";
    const hashtag = "education,cartography,puzzle,countries";
    const title = "MapPuzzle.xyz - Puzzle game based in maps";

    const Puzzles = (
      <Table striped bordered size="sm" className="legendInfo">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Map</th>
            <th scope="col">Credits</th>
          </tr>
        </thead>
        <tbody>
          {this.props.content.map((c: any) => (
            <tr key={c.id} id={c.id}>
              <td width="1%">
                <img src={c.icon} alt={c.name} />
              </td>
              <td width="30%">{c.name}</td>
              <td width="50%">{c.comment}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );

    return (
      <div>
        <Modal
          show={this.state.show}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          onHide={handleClose}
        >
          <Modal.Header>
            <Modal.Title id="contained-modal-title-vcenter">
              MapPuzzle.xyz - Puzzle game based in maps
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
                  We have a list on the left side of the screen, with the list
                  of puzzle pieces which, depending on the map, could be
                  countries, states, cities, provinces, etc. Each map piece is
                  shown with an illustration of the map. When you click on it,
                  it follows the mouse and you will have to look for its
                  equivalent on the map.
                </p>
                <p>
                  It also has a counter of pieces found, pieces to be searched
                  for and faults committed.
                </p>
                <h2>Credits</h2>
                {Puzzles}
                <p>
                  More info in{" "}
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
                <h4>Share MapPuzzle.xyz</h4>
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
                  title={title + " - " + this.props.name}
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
      </div>
    );
  }
}
