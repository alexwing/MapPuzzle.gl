import { useEffect, useState } from "react";
import { Jsondb } from "@mappuzzle/core";
import { bendFeatureCollection } from "../equalEarth";

/**
 * What scripts/build-world-backdrop.mjs writes: land, lakes and rivers, told
 * apart by `kind`. Nothing else, no names, no borders: it is scenery.
 */
export interface BackdropProperties {
  kind: "land" | "lake" | "river";
  /** Rivers only: how wide to draw them, in pixels. */
  w?: number;
  /**
   * Land only: a point inside the country, as longitude and latitude, for
   * telling whether a puzzle already covers it. Not bent with the geometry,
   * since properties are left alone; whoever tests it bends it first.
   */
  p?: [number, number];
}

type BackdropGeometry =
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon
  | GeoJSON.LineString
  | GeoJSON.MultiLineString;

export type BackdropFeature = GeoJSON.Feature<BackdropGeometry, BackdropProperties>;

export type BackdropCollection = GeoJSON.FeatureCollection<
  BackdropGeometry,
  BackdropProperties
>;

/** The backdrop split the way it is drawn: the land underneath, the water on it. */
export interface Backdrop {
  land: BackdropCollection;
  water: BackdropCollection;
}

/**
 * The world's ground, simplified and already bent, fetched once per page load
 * and shared by every map that asks. It is scenery for the Equal Earth view,
 * where the CARTO tiles cannot follow.
 */
let backdrop: Promise<Backdrop | null> | undefined;

function collection(features: BackdropFeature[]): BackdropCollection {
  return { type: "FeatureCollection", features };
}

function loadBackdrop(): Promise<Backdrop | null> {
  if (!backdrop) {
    backdrop = Jsondb("maps/world_backdrop.geojson")
      .then((raw: BackdropCollection | undefined) => {
        if (!raw?.features) return null;
        const bent = bendFeatureCollection(raw);
        return {
          land: collection(bent.features.filter((f) => f.properties.kind === "land")),
          water: collection(bent.features.filter((f) => f.properties.kind !== "land")),
        };
      })
      .catch(() => null);
  }
  return backdrop;
}

/**
 * The bent ground while `enabled`, null before it arrives and whenever it is
 * not wanted. Nothing is fetched until the first time it is.
 */
export function useEqualEarthBackdrop(enabled: boolean): Backdrop | null {
  const [ground, setGround] = useState<Backdrop | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    loadBackdrop().then((loaded) => {
      if (current) setGround(loaded);
    });
    return () => {
      current = false;
    };
  }, [enabled]);

  return enabled ? ground : null;
}
