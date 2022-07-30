import React from "react";
import Table from "react-bootstrap/Table";
import { className, setColor } from "../lib/Utils";

export default function PieceList(props: any) {
  const { pieces, founds, onPieceSelected, pieceSelected } = props;

  return (
    <React.Fragment>
      <Table striped bordered hover size="sm" className="legend">
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
