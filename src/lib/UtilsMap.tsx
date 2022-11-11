import React from "react";
import geojson2svg from "geojson2svg";
import { MapExtent, PieceProps } from "../models/Interfaces";
import { setColor } from "./Utils";


export const get_ST_EnvelopeFromGeometry = (geometry: PieceProps):MapExtent => {
  const geom: number[][][] = geometry.geometry.coordinates;

  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  for (let i = 0; i < geom.length; i++) {
    const item = geom[i];
    for (let j = 0; j < item.length; j++) {
      const item2 = item[j];
      for (let k = 0; k < item2.length; k++) {
        const item3 = item2[k];
        const x = item3[0];
        const y = item3[1];
        if (i === 0 && j === 0 && k === 0) {
          minX = x;
          maxX = x;
          minY = y;
          maxY = y;
        } else {
          if (x < minX) {
            minX = x;
          }
          if (x > maxX) {
            maxX = x;
          }
          if (y < minY) {
            minY = y;
          }
          if (y > maxY) {
            maxY = y;
          }
        }
      }
    }
  }

  return {
    top: maxY,
    left: minX,
    right: maxX,
    bottom: minY,
  };
};

export const getSvgFromGeometry = (c: PieceProps, viewBox = "0 0 100 100"): JSX.Element => {

  const converter = geojson2svg({
    attributes: {
      fill: setColor(c.properties.mapcolor),
      "stroke-width": 0,
    },
    mapExtent: get_ST_EnvelopeFromGeometry(c),
    viewportSize: { width: 100, height: 100 },
  });

  const svgStr = converter.convert({
    type: "FeatureCollection",
    features: [c],
  });

  return (
    <svg viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svgStr }} />
  );
};
