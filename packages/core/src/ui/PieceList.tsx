import React, { useState, useEffect, useRef } from "react";
import Table from "react-bootstrap/Table";
import { useKeyPress } from "../hooks/useKeyPress";
import { className } from "../lib/pieces";
import { setColor } from "../lib/colors";
import { pieceSilhouette } from "../geometry/pieceSilhouette";
import type { PieceProps } from "@mappuzzle/shared";
import { PuzzleService } from "../services/puzzleService";
import "./PieceList.css";

/** Width the silhouette is painted at, see .legendPiece > svg in PieceList.css. */
const PIECE_WIDTH_PX = 80;

interface PieceListProps {
  pieces: Array<PieceProps>;
  founds: Array<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPieceSelected: (pieceId: any) => void;
  handleUp: () => void;
  handleDown: () => void;
  pieceSelected: number;
  puzzleId: number;
  enableFlags: boolean;
  lang: string;
  flagsVersion?: number;
}

export default function PieceList({
  pieces,
  founds,
  onPieceSelected,
  handleUp,
  handleDown,
  pieceSelected,
  puzzleId,
  enableFlags,
  lang,
  flagsVersion = 0,
}: PieceListProps): JSX.Element {
  const [rtlClass, setRtlClass] = useState("");
  const upPress = useKeyPress("ArrowUp");
  const downPress = useKeyPress("ArrowDown");
  const [enablePress, setEnablePress] = useState(true);
  const tableRef = useRef<HTMLTableElement>(null);

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

  //scroll to piece selected
  const scrollToSelected = () => {
    if (tableRef.current) {
      const element = tableRef.current.querySelector(".table-primary");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (tableRef.current) {
        if (tableRef.current.contains(event.target as Node)) {
          setEnablePress(true);
        } else {
          setEnablePress(false);
        }
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const paintFlag = (c: PieceProps) => {
    if (!enableFlags) return null;
    //create flag image from piece id
    const flag = `../customFlags/${puzzleId.toString()}/64/${c.properties.cartodb_id}.png?v=${flagsVersion}`;
    return (
      <td className="imgflag">
        <div>
          <img src={flag} alt={c.properties.name} />
        </div>
      </td>
    );
  };

  return (
    <React.Fragment>
      <Table
        ref={tableRef}
        striped
        hover
        size="sm"
        className={"legend " + rtlClass}
      >
        <tbody>
          {pieces.map((c: PieceProps) => {
            if (founds.includes(c.properties.cartodb_id)) return null;
            const silhouette = pieceSilhouette(c, PIECE_WIDTH_PX);
            return (
              <tr
                key={c.properties.cartodb_id}
                onClick={onPieceSelected}
                id={c.properties.cartodb_id.toString()}
                className={className(c, pieceSelected)}
              >
                {paintFlag(c)}
                <td width="80%">{c.properties.name}</td>
                <td width="20%" align="right" className="legendPiece">
                  <svg viewBox={silhouette.box}>
                    <path
                      d={silhouette.poly}
                      stroke="black"
                      strokeWidth="0"
                      fill={setColor(c.properties.mapcolor)}
                    />
                  </svg>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </React.Fragment>
  );
}
