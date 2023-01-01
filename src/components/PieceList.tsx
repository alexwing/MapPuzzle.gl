import React, { useState, useEffect, useId } from "react";
import Table from "react-bootstrap/Table";
import { useKeyPress } from "../lib/useKeyPress";
import { className, setColor } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "../services/puzzleService";

interface PieceListProps {
  pieces: Array<PieceProps>;
  founds: Array<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPieceSelected: (pieceId: any) => void;
  handleUp: () => void;
  handleDown: () => void;
  pieceSelected: number;
  lang: string;
}

export default function PieceList({
  pieces,
  founds,
  onPieceSelected,
  handleUp,
  handleDown,
  pieceSelected,
  lang,
}: PieceListProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");
  const upPress = useKeyPress("ArrowUp");
  const downPress = useKeyPress("ArrowDown");
  const [enablePress, setEnablePress] = useState(true);

  const identify = "id_" + useId().replaceAll(":", "");
  const concernedElement = document.querySelector("#" + identify);

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

  useEffect(() => {
    if (upPress && enablePress) {
      handleUp();
      scrollToSelected();
    }
    // eslint-disable-next-line
  }, [upPress, enablePress]);

  useEffect(() => {
    if (downPress && enablePress) {
      handleDown();
      scrollToSelected();
    }
    // eslint-disable-next-line
  }, [downPress, enablePress]);

  //scroll to piece selected selected
  const scrollToSelected = () => {
    if (concernedElement) {
      // get element id identify and get class table-primary selected
      const element = document.querySelector(
        "#" + identify + " .table-primary"
      );
      //if element exist scroll to element
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const enablePressHandler = () => {
    setEnablePress(true);
  };

  const disablePressHandler = () => {
    setEnablePress(false);
  };
  useEffect(() => {
    document.addEventListener("mouseup", (event: MouseEvent) => {
      if (concernedElement && event) {
        if (concernedElement.contains(event.target ? event.target as Element : null)) {
          // Clicked in box
          enablePressHandler();
        } else {
          // Clicked outside the box
          disablePressHandler();
        }
      }
      event.stopPropagation();
      event.preventDefault();
    });
  }, [concernedElement]);

  const paintFlag = (c: PieceProps) => {
    //create svg flag from piece name on public\customFlags\{id}\{piece.name}.svg
    const flag = `../customFlags/1/64/${c.properties.cartodb_id}.png`

    return (
      <img
      src={flag}
      alt={c.properties.name}
    />
    );
  };



  return (
    <React.Fragment>
      <Table
        striped
        bordered
        hover
        size="sm"
        className={"legend " + rtlClass}
        id={identify}
      >
        <tbody>
          {pieces.map((c: PieceProps) =>
            founds.includes(c.properties.cartodb_id) ? null : (
              <tr
                key={c.properties.cartodb_id}
                onClick={onPieceSelected}
                id={c.properties.cartodb_id.toString()}
                className={className(c, pieceSelected)}
              >
                <td className="imgflag">
                  <div style={{}}>
                  { paintFlag(c)}
                  </div>
                </td>
                <td width="85%">{c.properties.name}</td>
                <td width="20%" align="right" className="legendPiece">
                  <svg viewBox={c.properties.box}>
                    <path
                      d={c.properties.poly}
                      stroke="black"
                      strokeWidth="0"
                      fill={setColor(c.properties.mapcolor)}
                    />
                  </svg>
                </td>
              </tr>
            )
          )}
        </tbody>
      </Table>
    </React.Fragment>
  );
}
