import { useEffect, useState } from "react";
import { Jsondb } from "@mappuzzle/core";
import { bendFeatureCollection } from "../equalEarth";

type Backdrop = GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>;

/**
 * The world's land, simplified and already bent, fetched once per page load
 * and shared by every map that asks. scripts/build-world-backdrop.mjs writes
 * the file; it is scenery for the Equal Earth view, where the CARTO tiles
 * cannot follow.
 */
let backdrop: Promise<Backdrop | null> | undefined;

function loadBackdrop(): Promise<Backdrop | null> {
  if (!backdrop) {
    backdrop = Jsondb("maps/world_backdrop.geojson")
      .then((collection: Backdrop | undefined) =>
        collection?.features ? bendFeatureCollection(collection) : null
      )
      .catch(() => null);
  }
  return backdrop;
}

/**
 * The bent land while `enabled`, null before it arrives and whenever it is not
 * wanted. Nothing is fetched until the first time it is.
 */
export function useEqualEarthBackdrop(enabled: boolean): Backdrop | null {
  const [land, setLand] = useState<Backdrop | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    loadBackdrop().then((collection) => {
      if (current) setLand(collection);
    });
    return () => {
      current = false;
    };
  }, [enabled]);

  return enabled ? land : null;
}
