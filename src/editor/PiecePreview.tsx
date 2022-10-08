import React, { useRef } from "react";
import { setColor } from "../lib/Utils";

/**
 * PiecePreview
 * Preview of a piece in the puzzle editor
 *
 * @author Alejandro Aranda (github.com/alexwing)
 *
 *
 */
function PiecePreview({ selected = null, centroid = null }: any) {
  const PiecePreviewRef: any = useRef();

  let RenderPiecePreview;
  if (selected) {
    let marginTop = -1 * centroid.top;
    let marginLeft = -1 * centroid.left ;
    RenderPiecePreview = (
      <div>
        <div
          className="piece-poi"
          style={{
            marginLeft:marginLeft+ "px",
            marginTop: marginTop+ "px"
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
