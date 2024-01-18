import React, { useState, useEffect, useId, useRef, useContext } from "react";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import { Button, Card, Container, Navbar } from "react-bootstrap";
import { Check } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { Col, Row } from "react-bootstrap";

import "./FlagCardsGenerator.css";
import ThemeContext from "../components/ThemeProvider";

interface PieceListProps {
  show: boolean;
  pieces: Array<PieceProps>;
  puzzleId: number;
  lang: string;
}

export default function FlagCardsGenerator({
  show = false,
  pieces,
  puzzleId,
  lang,
}: PieceListProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");
  const [showIn, setShowIn] = useState(false);
  const { t } = useTranslation();

  const enableFlags = true;

  function handleClose() {
    setShowIn(false);
  }

  useEffect(() => {
    setShowIn(show);
  }, [show]);

  //print flags from useRef when handlePrint is called

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
      <Container
      >
        <Row className="flagCards">
          {pieces.map((c: PieceProps) => (
            <Col sm={3} key={c.properties.cartodb_id}>
              <Card border="none">
                <Card.Body>
                  {paintFlag(c)}
                  <Card.Text>{c.properties.name}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </React.Fragment>
  );
}
