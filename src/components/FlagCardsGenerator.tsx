import React, { useState, useEffect, useId, useRef } from "react";
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

  const ref: any = useRef();

  const enableFlags = true;

  function handleClose() {
    setShowIn(false);
  }

  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //print flags from useRef when handlePrint is called

  const handlePrint = () => {
    const html = ref.current.innerHTML;
    const style = `
    <style>
    @media print {
      .flagCards .imgflag img {
        height: auto;
        width: 100%;
        /* conver svg to black lines withouth fill */
        filter: invert(0) grayscale(1) brightness(1) contrast(1);
        opacity: 0.15;    
      }
      .flagCards .card-text {
        font-weight: bold;
        text-align: center;
        text-align: center;
      }
      .flagCards .imgflag {
        border: 1px solid #dee2e6;
      }
      
      .flagCards .card {
          box-shadow: none;
          border: 0px;
          padding: 1.5%;
      }      
      .flagCards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 10px;
      }
    }
    </style>
    `;
    const printWindow = window.open("", "Print");
    if (!printWindow) return;
    printWindow.document.write(style);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

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
    const flag = `../customFlags/${puzzleId.toString()}/1024/${
      c.properties.cartodb_id
    }.png`;
    return (
      <div className="imgflag">
        <img src={flag} alt={c.properties.name} />
      </div>
    );
  };

  /*
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
          <Button
            className="btn btn-primary"
            onClick={handlePrint}
            variant="primary"
          >
            Print
          </Button>
        </Modal.Header>
        <Modal.Body ref={ref}>
          <Row className="flagCards">
            {pieces.map((c: PieceProps) =>
              founds.includes(c.properties.cartodb_id) ? null : (
                <Col sm={3} key={c.properties.cartodb_id}>
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
