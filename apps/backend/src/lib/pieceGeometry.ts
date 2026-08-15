/**
 * The three facts about a piece that the games need and the maps do not carry:
 * where its centre is, how big it is, and what it touches.
 *
 * None of it is in the GeoJSON — the maps hold geometry, a name and a colour —
 * and all of it is derivable, so it is derived once here rather than in every
 * game that wants it.
 */
import * as turf from "@turf/turf";

const EARTH_RADIUS = 6378137;
const LAT_LIMIT = 85.051129;

export interface PieceGeometry {
  cartodbId: number;
  /** Where the piece is, for a game that asks the player to point at it. */
  lat: number;
  lon: number;
  /** Whether the centre came from a person or from the geometry. */
  centreSource: "curated" | "computed";
  /** Square metres on the ellipsoid, not on the projection. */
  areaM2: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const toMercator = (lon: number, lat: number): [number, number] => [
  (EARTH_RADIUS * lon * Math.PI) / 180,
  EARTH_RADIUS *
    Math.log(
      Math.tan(
        Math.PI / 4 + ((Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, lat)) * Math.PI) / 180) / 2
      )
    ),
];

const fromMercator = (x: number, y: number): [number, number] => [
  (x / EARTH_RADIUS) * (180 / Math.PI),
  (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI),
];

function ringsOf(geometry: any): number[][][] {
  const out: number[][][] = [];
  if (!geometry) return out;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  if (!Array.isArray(polygons)) return out;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) if (Array.isArray(ring)) out.push(ring);
  }
  return out;
}

/**
 * Turns a curated grab point back into coordinates.
 *
 * custom_centroids holds two CSS margin percentages that shift a piece's
 * silhouette against the cursor — where a person decided the piece is held.
 * The silhouette's box has a known extent in EPSG:3857, so the offsets invert.
 * Both percentages resolve against the box *width*, which is how CSS margin
 * percentages work on either axis, hence the aspect ratio on the vertical one.
 *
 * Measured over the 1,850 usable rows: 98.0% of these land inside their own
 * piece, against 97.5% for the centroid of the largest polygon. The two
 * disagree most where the computed one is worst — 3,082 km apart on Tierra del
 * Fuego with its Antarctic claim — and it is the human one that is sensible.
 */
export function centreFromCurated(
  geometry: any,
  left: number,
  top: number
): [number, number] | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of ringsOf(geometry)) {
    for (const [lon, lat] of ring as number[][]) {
      const [x, y] = toMercator(lon, lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (!(width > 0) || !(height > 0)) return null;
  // A piece straddling the antimeridian gets a planet-wide box, which would put
  // its centre in the wrong hemisphere. Those fall back to the computed point.
  if (width > 20_000_000) return null;

  const x = minX + (-left / 100) * width;
  const y = maxY - ((-top / 100) * (width / height)) * height;
  const [lon, lat] = fromMercator(x, y);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

/** The biggest part of a piece: Alaska should not decide where the States are. */
function largestPolygon(geometry: any): any {
  if (geometry?.type === "Polygon") return geometry;
  const polygons = geometry?.coordinates ?? [];
  let best: any = null;
  let bestArea = -1;
  for (const coordinates of polygons) {
    const candidate = { type: "Polygon", coordinates };
    let area = 0;
    try {
      area = turf.area(turf.feature(candidate as any));
    } catch {
      area = 0;
    }
    if (area > bestArea) {
      bestArea = area;
      best = candidate;
    }
  }
  return best ?? { type: "Polygon", coordinates: [] };
}

/**
 * A point guaranteed to be inside the piece, for when there is no curated one.
 * pointOnFeature answers that by construction, unlike a centroid, which for a
 * horseshoe sits in the sea.
 */
export function centreComputed(geometry: any): [number, number] | null {
  try {
    const point = turf.pointOnFeature(turf.feature(largestPolygon(geometry) as any));
    const [lon, lat] = point.geometry.coordinates;
    return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
  } catch {
    return null;
  }
}

/** Square metres on the ellipsoid. On the projection, Greenland beats Africa. */
export function areaOf(geometry: any): number {
  try {
    return Math.round(turf.area(turf.feature(geometry)));
  } catch {
    return 0;
  }
}

/**
 * Which pieces touch which.
 *
 * These maps come from shapefiles, where neighbouring polygons are digitised
 * against each other and share their boundary vertices exactly, so matching
 * rounded coordinates finds almost every border for the cost of one pass. The
 * rounding is to six decimals, about 10 cm, which is finer than any of this
 * data and coarse enough to survive being written out and read back.
 */
export function adjacency(
  features: { cartodbId: number; geometry: any }[]
): [number, number][] {
  const atPoint = new Map<string, Set<number>>();
  for (const { cartodbId, geometry } of features) {
    for (const ring of ringsOf(geometry)) {
      for (const [lon, lat] of ring as number[][]) {
        const key = `${lon.toFixed(6)},${lat.toFixed(6)}`;
        let here = atPoint.get(key);
        if (!here) {
          here = new Set();
          atPoint.set(key, here);
        }
        here.add(cartodbId);
      }
    }
  }

  const edges = new Set<string>();
  for (const pieces of atPoint.values()) {
    if (pieces.size < 2) continue;
    const list = [...pieces].sort((a, b) => a - b);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) edges.add(`${list[i]}:${list[j]}`);
    }
  }

  return [...edges].map((edge) => {
    const [a, b] = edge.split(":");
    return [Number(a), Number(b)] as [number, number];
  });
}
