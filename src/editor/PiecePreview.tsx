import React, { useRef } from "react";
import CustomCentroids from "../../backend/src/models/customCentroids";
import { setColor } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";

/**
 * PiecePreview
 * Preview of a piece in the puzzle editor
 *
 * @author Alejandro Aranda (github.com/alexwing)
 *
 *
 */
interface PiecePreviewProps {
  selected: PieceProps;
  centroid?: CustomCentroids;
}

function PiecePreview({ selected, centroid }: PiecePreviewProps): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PiecePreviewRef: any = useRef();

  let RenderPiecePreview;
  if (selected && centroid) {
    const marginTop = -1 * centroid.top;
    const marginLeft = -1 * centroid.left;
    RenderPiecePreview = (
      <div>
        <div
          className="piece-poi"
          style={{
            marginLeft: marginLeft + "px",
            marginTop: marginTop + "px",
          }}
        ></div>
        <svg
          width={"100px"}
          viewBox={selected ? selected.properties.box : ""}
          style={{
            border: "0px solid lightgray",
          }}
        >
          <path
            d={selected ? selected.properties.poly : ""}
            stroke="black"
            strokeWidth="0"
            fill={setColor(selected.properties.mapcolor)}
          />
        </svg>
      </div>
    );
  } else {
    RenderPiecePreview = <span></span>;
  }

  return (
    <React.Fragment>
      <div ref={PiecePreviewRef} className="piece-preview">
        {RenderPiecePreview}
      </div>
    </React.Fragment>
  );
}

export default PiecePreview;
