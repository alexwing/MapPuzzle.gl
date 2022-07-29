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
          style={{
            position: "absolute",
            marginLeft:marginLeft+ "px",
            marginTop: marginTop+ "px",
            width: "10px",
            height: "10px",
            backgroundColor: "#000",
            border: "1px solid lightgray",
            borderRadius: "5px",
            overflow: "hidden",
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
