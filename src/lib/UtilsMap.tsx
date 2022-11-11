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

  //get all x and y
  const allX: number[] = [];
  const allY: number[] = [];
  geom.forEach((multiPolygon) => {
    multiPolygon.forEach((polygon) => {
      polygon.forEach((point) => {
        allX.push(point[0]);
        allY.push(point[1]);
      });      
    });
  });

  //get min and max
  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY);

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
