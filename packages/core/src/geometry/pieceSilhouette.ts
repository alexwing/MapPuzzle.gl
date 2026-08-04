import type { PieceProps } from "@mappuzzle/shared";

/**
 * Runtime generation of the piece silhouettes used by the piece list, the drag
 * cursor and the editor preview.
 *
 * Until now these came pre-generated inside each map's GeoJSON, in the `poly`
 * (path `d`) and `box` (`viewBox`) properties, produced by PostGIS with
 * `ST_AsSVG(ST_Translate(ST_Transform(geom, 3857), -xmin, -ymax))` — see
 * backend/src/server/MapGenerator.ts. That duplicated the geometry the client
 * already downloads for deck.gl and accounted for 56% of public/maps.
 *
 * This module reproduces the very same transform in the browser: project to
 * Web Mercator (EPSG:3857), move the origin to the top-left corner of the
 * piece, flip Y. Output units are therefore metres, exactly like before, so
 * consumers keep their `viewBox` arithmetic untouched.
 *
 * The difference is that the path is simplified for the size it will actually
 * be painted at, instead of carrying full double precision for a 40px cell.
 */

export interface Silhouette {
  /** SVG path `d`, in EPSG:3857 metres, origin at the piece's top-left corner. */
  poly: string;
  /** SVG `viewBox`: `0 0 width height`, in the same metres. */
  box: string;
}

/** Bounding box in EPSG:3857 metres. */
interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type Point = [number, number];
type Ring = Point[];

/** Earth radius used by EPSG:3857, matching PostGIS ST_Transform. */
const EARTH_RADIUS = 6378137;
/** Web Mercator is undefined at the poles; clamp as every web map does. */
const MAX_LATITUDE = 85.051129;
/** How much detail to drop, expressed in pixels of the final render. */
const TOLERANCE_PX = 0.4;
/** Render sizes are bucketed to powers of two to bound the cache per piece. */
const MIN_TARGET_PX = 48;
const MAX_TARGET_PX = 1024;

interface CacheEntry {
  bounds?: Bounds;
  box?: string;
  polys: Map<number, string>;
}

/**
 * Keyed on the `properties` object so entries die with the map they belong to,
 * and so pieces from different puzzles can never collide on `cartodb_id`.
 */
const cache = new WeakMap<object, CacheEntry>();

/**
 * Undefined for a piece with no `properties` to key on — the drag cursor starts
 * out with an empty piece, and it re-renders on every mouse move, so this path
 * has to stay cheap and never throw.
 */
function entryFor(piece: PieceProps): CacheEntry | undefined {
  const key: unknown = piece?.properties;
  if (key === null || typeof key !== "object") return undefined;
  let entry = cache.get(key as object);
  if (!entry) {
    entry = { polys: new Map() };
    cache.set(key as object, entry);
  }
  return entry;
}

/** Rounds a render size up to the next power of two within the allowed range. */
function bucketFor(targetPx: number): number {
  if (!Number.isFinite(targetPx) || targetPx <= MIN_TARGET_PX) {
    return MIN_TARGET_PX;
  }
  return Math.min(MAX_TARGET_PX, Math.pow(2, Math.ceil(Math.log2(targetPx))));
}

/**
 * Flattens a Polygon or MultiPolygon `coordinates` array into a list of rings,
 * copied as [lon, lat] pairs. Holes are kept: they are rings too, and the SVG
 * non-zero fill rule renders them as holes just as the PostGIS output did.
 */
function collectRings(geometry: PieceProps["geometry"]): Ring[] {
  const coordinates = geometry?.coordinates as unknown;
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];

  // Polygon:      coordinates[0][0]    is a position -> [0][0][0] is a number
  // MultiPolygon: coordinates[0][0][0] is a position -> [0][0][0] is an array
  const polygons = Array.isArray(coordinates[0]?.[0]?.[0])
    ? (coordinates as number[][][][])
    : [coordinates as number[][][]];

  const rings: Ring[] = [];
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) continue;
      const copy: Ring = new Array(ring.length);
      for (let i = 0; i < ring.length; i++) {
        copy[i] = [ring[i][0], ring[i][1]];
      }
      rings.push(copy);
    }
  }
  return rings;
}

/**
 * Shifts longitudes so a piece straddling the antimeridian stays in one place.
 *
 * Without this, Fiji, Kiribati and New Zealand's Northland get a bounding box
 * spanning the whole planet (40.000 km wide, 350 km tall) and render as a
 * useless sliver — the pre-generated PostGIS paths have exactly that defect,
 * because ST_Transform does not unwrap either.
 *
 * Two passes: first each ring is made continuous with itself, then every ring
 * is brought within half a turn of the largest one. Mutates the copies made by
 * collectRings.
 */
function unwrapLongitudes(rings: Ring[]): void {
  if (rings.length === 0) return;

  const centers: number[] = [];
  let reference = 0;
  let widest = -1;

  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    let offset = 0;
    let sum = ring[0][0];
    for (let i = 1; i < ring.length; i++) {
      const step = ring[i][0] - ring[i - 1][0] - offset;
      if (step > 180) offset += 360;
      else if (step < -180) offset -= 360;
      ring[i][0] -= offset;
      sum += ring[i][0];
    }
    centers[r] = sum / ring.length;
    if (ring.length > widest) {
      widest = ring.length;
      reference = centers[r];
    }
  }

  for (let r = 0; r < rings.length; r++) {
    const shift = Math.round((centers[r] - reference) / 360) * 360;
    if (shift === 0) continue;
    const ring = rings[r];
    for (let i = 0; i < ring.length; i++) {
      ring[i][0] -= shift;
    }
  }
}

/** Projects [lon, lat] rings to EPSG:3857 metres, in place. */
function projectRings(rings: Ring[]): Ring[] {
  for (const ring of rings) {
    for (const point of ring) {
      const lat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, point[1]));
      point[0] = (EARTH_RADIUS * point[0] * Math.PI) / 180;
      point[1] =
        EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    }
  }
  return rings;
}

/** lon/lat rings, unwrapped and projected to the metres the SVG is drawn in. */
function ringsOf(geometry: PieceProps["geometry"]): Ring[] {
  const rings = collectRings(geometry);
  unwrapLongitudes(rings);
  return projectRings(rings);
}

function boundsOf(rings: Ring[]): Bounds | undefined {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return undefined;
  return { minX, minY, maxX, maxY };
}

/**
 * Ramer-Douglas-Peucker, iterative to keep the call stack out of it: some rings
 * carry tens of thousands of vertices.
 *
 * The ring is closed, so the first baseline is degenerate (first === last). In
 * that case every point projects onto the start vertex, which splits the ring
 * at its farthest vertex — the usual way of seeding RDP on a closed ring — and
 * both halves then have a proper baseline.
 */
function simplifyRing(points: Ring, tolerance: number): Ring {
  const total = points.length;
  if (total <= 4 || tolerance <= 0) return points;

  const keep = new Uint8Array(total);
  keep[0] = 1;
  keep[total - 1] = 1;

  const toleranceSq = tolerance * tolerance;
  const stack: number[] = [0, total - 1];

  while (stack.length > 0) {
    const last = stack.pop() as number;
    const first = stack.pop() as number;
    if (last - first < 2) continue;

    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    let farthest = -1;
    let farthestSq = toleranceSq;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = lengthSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lengthSq : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const distanceSq = ex * ex + ey * ey;
      if (distanceSq > farthestSq) {
        farthestSq = distanceSq;
        farthest = i;
      }
    }

    if (farthest !== -1) {
      keep[farthest] = 1;
      stack.push(first, farthest, farthest, last);
    }
  }

  const simplified: Ring = [];
  for (let i = 0; i < total; i++) {
    if (keep[i]) simplified.push(points[i]);
  }
  return simplified;
}

/** Largest side of a ring's own bounding box, to spot invisible islands. */
function ringExtent(ring: Ring): number {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

function buildPath(rings: Ring[], bounds: Bounds, tolerance: number): string {
  const { minX, maxY } = bounds;
  const parts: string[] = [];
  for (const ring of rings) {
    // Islands smaller than the tolerance are below one pixel at this size;
    // skipping them keeps archipelagos (Peru in spanish_empire has 509 rings)
    // from filling the path with invisible triangles.
    if (tolerance > 0 && ringExtent(ring) < tolerance) continue;
    const simplified = simplifyRing(ring, tolerance);
    if (simplified.length < 3) continue;
    // Same shape ST_AsSVG emitted: one lineto, then implicit coordinate pairs.
    let path = `M${Math.round(simplified[0][0] - minX)} ${Math.round(
      maxY - simplified[0][1]
    )}L`;
    for (let i = 1; i < simplified.length; i++) {
      const x = Math.round(simplified[i][0] - minX);
      const y = Math.round(maxY - simplified[i][1]);
      path += `${i === 1 ? "" : " "}${x} ${y}`;
    }
    parts.push(path + "Z");
  }
  return parts.join("");
}

function formatBox(bounds: Bounds): string {
  return `0 0 ${Math.round(bounds.maxX - bounds.minX)} ${Math.round(
    bounds.maxY - bounds.minY
  )}`;
}

/**
 * The piece's `viewBox`, in metres. Cheaper than the full silhouette: consumers
 * that need the on-screen size before choosing a detail level (the drag cursor)
 * can ask for this first.
 */
export function pieceBox(piece: PieceProps): string {
  const entry = entryFor(piece);
  if (!entry) return "";
  if (entry.box !== undefined) return entry.box;

  const bounds = boundsOf(ringsOf(piece.geometry));
  if (!bounds) {
    entry.box = piece.properties?.box ?? "";
  } else {
    entry.bounds = bounds;
    entry.box = formatBox(bounds);
  }
  return entry.box;
}

/**
 * The piece's silhouette, simplified for a render roughly `targetPx` wide.
 * Memoised per piece and per size bucket; regenerating costs ~0.2 ms, so no
 * persistent cache is warranted.
 *
 * Falls back to the pre-generated `poly`/`box` of legacy maps when the geometry
 * is missing or degenerate.
 */
export function pieceSilhouette(
  piece: PieceProps,
  targetPx: number = MIN_TARGET_PX
): Silhouette {
  const entry = entryFor(piece);
  if (!entry) return { poly: "", box: "" };

  const bucket = bucketFor(targetPx);
  const cached = entry.polys.get(bucket);
  if (cached !== undefined && entry.box !== undefined) {
    return { poly: cached, box: entry.box };
  }

  const rings = ringsOf(piece.geometry);
  const bounds = entry.bounds ?? boundsOf(rings);
  if (!bounds) {
    // Nothing to project: fall back to whatever a legacy map shipped with.
    const poly = piece.properties?.poly ?? "";
    entry.box = piece.properties?.box ?? "";
    entry.polys.set(bucket, poly);
    return { poly, box: entry.box };
  }
  entry.bounds = bounds;
  entry.box = formatBox(bounds);

  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const tolerance = extent > 0 ? (TOLERANCE_PX * extent) / bucket : 0;
  // A piece made only of islands smaller than the tolerance would simplify away
  // to nothing; draw it unsimplified rather than render an empty cell.
  const poly =
    buildPath(rings, bounds, tolerance) || buildPath(rings, bounds, 0);
  entry.polys.set(bucket, poly);

  return { poly, box: entry.box };
}
