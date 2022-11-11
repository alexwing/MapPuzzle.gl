import React from "react";
import geojson2svg from "geojson2svg";
import { MapExtent, PieceProps } from "../models/Interfaces";
import { setColor } from "./Utils";
import { reproject } from "reproject";
import "epsg";

export const get_ST_EnvelopeFromGeometry = (
  geometry: PieceProps
): MapExtent => {
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


export const getExtendFromGeometry = (
  geometry: PieceProps
): MapExtent => {
  const geomDest = reproject(geometry, "EPSG:4326", "EPSG:3857");
  if (geomDest) {
    return get_ST_EnvelopeFromGeometry(geomDest);
  }
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
  
};


export const getSvgFromGeometry = (
  c: PieceProps,
  viewBox = "0 0 100 100"
): JSX.Element => {
  const geomOrigin = {
    type: "FeatureCollection",
    features: [c],
  };
  const geomDest = reproject(geomOrigin, "EPSG:4326", "EPSG:3857");

  const converter = geojson2svg({
    attributes: {
      fill: setColor(c.properties.mapcolor),
      "stroke-width": 0,
    },
    mapExtent: get_ST_EnvelopeFromGeometry(geomDest.features[0]),
    viewportSize: { width: 100, height: 100 },
  });

  try {
    const svgStr = converter.convert(geomDest);
    return (
      <svg viewBox={viewBox} dangerouslySetInnerHTML={{ __html: svgStr }} />
    );
  } catch (e) {
    console.log(e);
  }
  return <span></span>;
};
