import React, { useState, useEffect, useId } from "react";
import Table from "react-bootstrap/Table";
import { className, setColor } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import "./PieceList.css";
import { Button, Card, Modal } from "react-bootstrap";
import { Check } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { Col, Row } from "react-bootstrap";

import "./FlagCardsGenerator.css";

interface PieceListProps {
  show: boolean;
  pieces: Array<PieceProps>;
  founds: Array<number>;
  pieceSelected: number;
  puzzleId: number;
  enableFlags: boolean;
  lang: string;
}

export default function FlagCardsGenerator({
  show = false,
  pieces,
  founds,
  pieceSelected,
  puzzleId,
  lang,
}: PieceListProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");

  const [showIn, setShowIn] = useState(false);
  const identify = "id_" + useId().replaceAll(":", "");
  const { t } = useTranslation();

  const enableFlags = true;

  function handleClose() {
    setShowIn(false);
  }

  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //on init load if rtl lang
  useEffect(() => {
    PuzzleService.getLangIsRtl(lang)
      .then((isRtl) => {
        setRtlClass(isRtl ? "rtl" : "");
      })
      .catch((err) => {
        console.log(err);
        setRtlClass("");
      });
  }, [lang]);

  const paintFlag = (c: PieceProps) => {
    if (!enableFlags) return null;
    //create flag image from piece id
    const flag = `../customFlags/${puzzleId.toString()}/1024/${c.properties.cartodb_id}.png`;
    const flagSvg = `../customFlags/${puzzleId.toString()}/${ c.properties.cartodb_id}.svg`;
    return (
      <div className="imgflag">
          <img  src={flag} alt={c.properties.name} />
         <svg  viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
            <image href={flagSvg} height="100%" width="100%" />
          </svg>
      </div>


    );
  };

  /*
  const paintFlag = (c: PieceProps) => {
    if (!enableFlags) return null;

    const svgFlag = `../customFlags/${puzzleId.toString()}/${
      c.properties.cartodb_id
    }.svg`;
    const pngFlag = `../customFlags/${puzzleId.toString()}/${
      c.properties.cartodb_id
    }.png`;

    return (
      <td className="imgflag">
        <div>
          <img
            src={svgFlag}
            alt={c.properties.name}
            onError={(e) => {
              const imgElement = e.target as HTMLImageElement;
              if (imgElement.src === svgFlag) {
                imgElement.src = `${pngFlag}?timestamp=${new Date().getTime()}`;
              } else if (imgElement.src.includes(pngFlag)) {
                imgElement.style.display = "none";
              }
            }}
          />
        </div>
      </td>
    );
  };
  */

  return (
    <React.Fragment>
      <Modal
        show={showIn}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
        className="flagCardsModal"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            {t("common.share.title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="flagCards">
          <Row>
            {pieces.map((c: PieceProps) =>
              founds.includes(c.properties.cartodb_id) ? null : (
                <Col sm={4} key={c.properties.cartodb_id}>
                  <Card border="none">
                    <Card.Body>
                      {paintFlag(c)}
                      <Card.Text>{c.properties.name}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              )
            )}
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
