import React, { useState, useEffect, useId } from "react";
import Table from "react-bootstrap/Table";
import { useKeyPress } from "../lib/useKeyPress";
import { className, setColor } from "../lib/Utils";
import { PuzzleService } from "../services/puzzleService";

export default function PieceList(props: any) {
  const {
    pieces,
    founds,
    onPieceSelected,
    handleUp,
    handleDown,
    pieceSelected,
    lang,
  } = props;
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
    }
  // eslint-disable-next-line
  }, [upPress,enablePress]);

  useEffect(() => {
    if (downPress && enablePress) {
      handleDown();
    }
  // eslint-disable-next-line
  }, [downPress,enablePress]);

  const enablePressHandler = () => {
    setEnablePress(true);
  };

  const disablePressHandler = () => {
    setEnablePress(false);
  };
  useEffect(() => {
    document.addEventListener("mouseup", (event: any) => {
      if (concernedElement && event) {
        if (concernedElement.contains(event.target)) {
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
          {pieces.map((c: any) =>
            founds.includes(c.properties.cartodb_id) ? null : (
              <tr
                key={c.properties.cartodb_id}
                onClick={onPieceSelected}
                id={c.properties.cartodb_id}
                className={className(c, parseInt(pieceSelected))}
              >
                <td width="80%">{c.properties.name}</td>
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
