import React, { useState, useEffect, useRef } from "react";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Col, Row } from "react-bootstrap";

import "./FlagCardsGenerator.css";

interface PieceListProps {
  show: boolean;
  pieces: Array<PieceProps>;
  puzzleId: number;
  lang: string;
}

// eslint-disable-next-line react/prop-types
function AdjustableText({ children }) {
  const [fontSize, setFontSize] = useState(2);
  const textRef = useRef();

  const adjustFontSize = () => {
    const element = textRef.current as unknown as HTMLElement;
    if (element.scrollHeight > element.offsetHeight) {
      setFontSize((prevFontSize) => prevFontSize - 0.05);
      requestAnimationFrame(() => {
        adjustFontSize();
      });
    }
  };

  useEffect(() => {
    adjustFontSize();
  }, [children]);

  return (
    <Card.Text style={{ fontSize: `${fontSize}em` }} ref={textRef as any}>
      {children}
    </Card.Text>
  );
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

  return (
    <React.Fragment>
      <Row>
        {pieces.map((c: PieceProps) => (
          <Col sm={3} key={c.properties.cartodb_id}>
            <Card border="none">
              <Card.Body>
                {paintFlag(c)}
                <AdjustableText>{c.properties.name}</AdjustableText>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </React.Fragment>
  );
}
