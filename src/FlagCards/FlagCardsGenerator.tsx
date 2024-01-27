import React, { useState, useEffect, useRef } from "react";
import { PieceProps } from "../models/Interfaces";
import { Card } from "react-bootstrap";
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
    <Card.Text style={{ fontSize: `${fontSize}em` }} ref={textRef as never}>
      {children}
    </Card.Text>
  );
}

export default function FlagCardsGenerator({
  pieces,
  puzzleId,
}: PieceListProps): JSX.Element {
  const enableFlags = true;

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
