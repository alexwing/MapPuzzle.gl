import React, { useRef } from "react";
import CustomCentroids from "../../backend/src/models/customCentroids";
import { pieceSilhouette } from "../lib/pieceSilhouette";
import { setColor } from "../lib/Utils";
import { PieceProps } from "../models/Interfaces";

/** Width the preview is painted at, see the svg below. */
const PREVIEW_WIDTH_PX = 100;

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

  let RenderPiecePreview: JSX.Element;
  if (selected && centroid) {
    const marginTop = -1 * centroid.top;
    const marginLeft = -1 * centroid.left;
    const silhouette = pieceSilhouette(selected, PREVIEW_WIDTH_PX);
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
          width={PREVIEW_WIDTH_PX + "px"}
          viewBox={silhouette.box}
          style={{
            border: "0px solid lightgray",
          }}
        >
          <path
            d={silhouette.poly}
            stroke="black"
            strokeWidth="0"
            fill={setColor(selected.properties.mapcolor || 0)}
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
