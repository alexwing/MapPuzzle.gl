import type { ViewState } from "react-map-gl";
import type { PieceProps } from "@mappuzzle/shared";
import { pieceBounds } from "@mappuzzle/core";

/**
 * Equal Earth on a Web Mercator renderer.
 *
 * deck.gl 8.9 projects longitude and latitude through Web Mercator and through
 * nothing else, and the CARTO tiles under the map are Mercator by construction.
 * Rather than replace the renderer, the geometry is bent before it gets there:
 * every vertex is projected to Equal Earth, and the Equal Earth point is then
 * read back through the inverse of Mercator as if it were a longitude and a
 * latitude. deck projects those through Mercator again, which undoes the second
 * step and leaves the first — what reaches the screen is the Equal Earth plane,
 * exactly. Measured against deck's own projection maths over the whole globe:
 * the worst discrepancy is 3e-13 of a pixel, and the scale is the same on both
 * axes.
 *
 * Everything downstream keeps working untouched because it all lives on that
 * one plane: the view state and its controller, the tilt and the turn, the
 * transitions, the silhouettes — Mercator projections of whatever they are
 * handed, so handed bent coordinates they come out Equal Earth — and the
 * homography that lays the dragged piece on the tilted ground.
 *
 * The bent world spans ±155° of longitude and ±60° of latitude, well inside
 * Mercator's ±180° and ±85°, so nothing is clipped and nothing wraps.
 *
 * Šavrič, Patterson & Jenny, "The Equal Earth map projection", IJGIS 2018.
 */

export type Projection = "mercator" | "equalEarth";

/** Where the choice is kept between visits. */
export const PROJECTION_COOKIE = "projection";

/** The saved choice, or Mercator, which is what the map has always been. */
export function projectionFromCookie(
  saved: string | null | undefined
): Projection {
  return saved === "equalEarth" ? "equalEarth" : "mercator";
}

/** A map's GeoJSON as the game holds it: every feature is a piece. */
export interface PieceCollection {
  type: string;
  features: PieceProps[];
}

// The projection's polynomial, in the parametric latitude θ it is written in.
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
/** sin 60°: the parametric latitude satisfies sin θ = M · sin φ. */
const M = Math.sqrt(3) / 2;
const RADIANS = Math.PI / 180;
const NEWTON_TOLERANCE = 1e-12;
/** Where Web Mercator gives up, and where deck clamps the camera. */
const MAX_LATITUDE = 85.051129;
/** EPSG:3857's radius: the metres a piece's box is measured in. */
const EARTH_RADIUS = 6378137;

/** The polynomial's contribution to x, for a parametric latitude. */
function stretch(theta2: number, theta6: number): number {
  return A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2);
}

/** Equal Earth on the unit sphere. Radians in, plane units out. */
function forward(lambda: number, phi: number): [number, number] {
  const theta = Math.asin(M * Math.sin(phi));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  return [
    (lambda * Math.cos(theta)) / (M * stretch(theta2, theta6)),
    theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2)),
  ];
}

/**
 * Back from the plane to the sphere, or null for a point that is not on the
 * map — beyond the poles, or past the outline. Newton's method on the
 * parametric latitude, the way d3-geo does it; a dozen steps is far more than
 * it ever needs.
 */
function inverse(x: number, y: number): [number, number] | null {
  let theta = y;
  let theta2 = theta * theta;
  let theta6 = theta2 * theta2 * theta2;
  for (let i = 0; i < 12; i++) {
    const value = theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2)) - y;
    const step = value / stretch(theta2, theta6);
    theta -= step;
    theta2 = theta * theta;
    theta6 = theta2 * theta2 * theta2;
    if (Math.abs(step) < NEWTON_TOLERANCE) break;
  }
  const sinPhi = Math.sin(theta) / M;
  if (!(Math.abs(sinPhi) <= 1)) return null;
  const lambda = (M * x * stretch(theta2, theta6)) / Math.cos(theta);
  if (!Number.isFinite(lambda) || Math.abs(lambda) > Math.PI + 1e-9) return null;
  return [lambda, Math.asin(sinPhi)];
}

/** Web Mercator's y for a latitude, and back. Unit sphere, radians. */
const mercatorY = (phi: number) => Math.log(Math.tan(Math.PI / 4 + phi / 2));
const mercatorPhi = (y: number) => 2 * Math.atan(Math.exp(y)) - Math.PI / 2;

/**
 * A real position as the longitude and latitude that Mercator will put where
 * Equal Earth would have put the original. Degrees in, degrees out.
 */
export function bend(longitude: number, latitude: number): [number, number] {
  const [x, y] = forward(longitude * RADIANS, latitude * RADIANS);
  return [x / RADIANS, mercatorPhi(y) / RADIANS];
}

/** The real position under a bent one, or null off the map. Degrees. */
export function unbend(
  longitude: number,
  latitude: number
): [number, number] | null {
  const real = inverse(longitude * RADIANS, mercatorY(latitude * RADIANS));
  return real && [real[0] / RADIANS, real[1] / RADIANS];
}

/** GeoJSON coordinates at any depth: a position, or arrays of these. */
type Coordinates = number[] | Coordinates[];

function isPosition(coordinates: Coordinates): coordinates is number[] {
  return typeof coordinates[0] === "number";
}

function bendCoordinates(coordinates: Coordinates): Coordinates {
  if (isPosition(coordinates)) return bend(coordinates[0], coordinates[1]);
  return coordinates.map(bendCoordinates);
}

interface Bendable {
  geometry: { coordinates: Coordinates };
}

/**
 * The same collection, bent. The features are new objects over new geometry,
 * so the silhouettes — cached per geometry — come out in the right shape, but
 * they share their `properties` with the originals: names are translated in
 * place on those, and the bent map has to see the translation too.
 */
export function bendFeatureCollection<C extends { features: Bendable[] }>(
  collection: C
): C {
  return {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: bendCoordinates(feature.geometry.coordinates),
      },
    })),
  } as C;
}

/**
 * Where the pointer holds a piece: the offset from the piece's top-left corner
 * to the grab point, as the editor stores it. Negative, since it is applied as
 * a margin that pulls the drawing up and to the left — and, a CSS quirk the
 * editor's picker was calibrated against and CursorCore reproduces, both
 * numbers are percentages of the piece's WIDTH.
 */
export interface GrabPoint {
  left: number;
  top: number;
}

/**
 * The same grab point over the bent piece.
 *
 * The percentages name a place on the piece — where the editor decided it
 * should hang from — but they name it as a share of the piece's width, and
 * bending changes a piece's proportions. Canada is taller than it is wide in
 * Mercator and twice as wide as it is tall in Equal Earth, so its stored -94%
 * went from holding the piece 72% of the way down it to 196%: the whole
 * country floated above the pointer, about two of its own heights up.
 *
 * So the percentages are read back into the place they mean. The point is
 * taken off the piece's Mercator box, unprojected, bent, and measured against
 * the bent box, and the piece then hangs from the same corner of Canada
 * whichever projection is on. A piece with no geometry to bound keeps what it
 * was given.
 */
export function bendGrab(
  grab: GrabPoint,
  piece: PieceProps,
  bentPiece: PieceProps
): GrabPoint {
  const flat = pieceBounds(piece);
  const bent = pieceBounds(bentPiece);
  if (!flat || !bent) return grab;

  const width = flat.maxX - flat.minX;
  const longitude =
    (flat.minX - (grab.left / 100) * width) / (EARTH_RADIUS * RADIANS);
  const latitude = clampLatitude(
    mercatorPhi((flat.maxY + (grab.top / 100) * width) / EARTH_RADIUS) / RADIANS
  );

  const [bentLongitude, bentLatitude] = bend(longitude, latitude);
  const bentWidth = bent.maxX - bent.minX;
  const left =
    ((bent.minX - bentLongitude * RADIANS * EARTH_RADIUS) / bentWidth) * 100;
  const top =
    ((mercatorY(bentLatitude * RADIANS) * EARTH_RADIUS - bent.maxY) / bentWidth) * 100;

  return Number.isFinite(left) && Number.isFinite(top) ? { left, top } : grab;
}

/**
 * How far Equal Earth stretches a parallel at a latitude, relative to the
 * sphere: ∂x/∂λ over cos φ. Meridians are stretched by the reciprocal, since
 * the projection preserves area.
 */
function parallelStretch(phi: number): number {
  const theta = Math.asin(M * Math.sin(phi));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  return Math.cos(theta) / (M * stretch(theta2, theta6) * Math.cos(phi));
}

/**
 * The zoom to add when a view moves from Mercator to Equal Earth so that the
 * region around its centre keeps the footprint it had.
 *
 * Mercator stretches both axes by 1/cos φ. Equal Earth stretches one axis by k
 * and the other by 1/k — which is which depends on the latitude — so no single
 * zoom matches both. Matching the axis that would grow the most keeps the
 * region within the space it used to fill; the other axis comes out smaller,
 * and all of it stays in view.
 */
function zoomShift(latitude: number): number {
  const phi = latitude * RADIANS;
  return -Math.log2(Math.cos(phi)) - Math.abs(Math.log2(parallelStretch(phi)));
}

const clampLatitude = (latitude: number) =>
  Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));

/**
 * The five numbers that place the camera. Transition props are left behind on
 * purpose: the map is swapped under the camera, and there is nothing to
 * animate across that.
 */
function camera(
  view: ViewState,
  longitude: number,
  latitude: number,
  zoom: number
): ViewState {
  return {
    longitude,
    latitude,
    zoom,
    bearing: view.bearing ?? 0,
    pitch: view.pitch ?? 0,
  };
}

/** A view over the real map, as the same view over the bent one. */
export function bendView(view: ViewState): ViewState {
  const latitude = clampLatitude(view.latitude);
  const [longitude, bentLatitude] = bend(view.longitude, latitude);
  return camera(view, longitude, bentLatitude, view.zoom + zoomShift(latitude));
}

/**
 * A view over the bent map, as the same view over the real one, or null when
 * the centre is off the map — the player can pan into the void past the
 * outline, and there is no real place under that.
 */
export function unbendView(view: ViewState): ViewState | null {
  const real = unbend(view.longitude, view.latitude);
  if (!real) return null;
  const [longitude, latitude] = real;
  return camera(view, longitude, latitude, view.zoom - zoomShift(latitude));
}

type Line = number[][];

/** The edge of the world: both bounding meridians, pole to pole, bent. */
function outlineRing(): Line {
  const ring: Line = [];
  for (let lat = -90; lat <= 90; lat++) ring.push(bend(180, lat));
  for (let lat = 90; lat >= -90; lat--) ring.push(bend(-180, lat));
  ring.push(ring[0]);
  return ring;
}

/**
 * Meridians and parallels every `step` degrees, bent. The bounding meridians
 * and the poles are left out: they are the outline.
 */
function graticuleLines(step: number): Line[] {
  const lines: Line[] = [];
  for (let lon = -180 + step; lon < 180; lon += step) {
    const meridian: Line = [];
    for (let lat = -90; lat <= 90; lat++) meridian.push(bend(lon, lat));
    lines.push(meridian);
  }
  for (let lat = -90 + step; lat < 90; lat += step) {
    const parallel: Line = [];
    for (let lon = -180; lon <= 180; lon++) parallel.push(bend(lon, lat));
    lines.push(parallel);
  }
  return lines;
}

export interface Scenery {
  outline: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  graticule: GeoJSON.FeatureCollection<GeoJSON.MultiLineString>;
}

let scenery: Scenery | undefined;

/** The planisphere's own furniture, its outline and a 30° graticule. Built once. */
export function equalEarthScenery(): Scenery {
  if (!scenery) {
    scenery = {
      outline: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [outlineRing()] },
          },
        ],
      },
      graticule: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "MultiLineString", coordinates: graticuleLines(30) },
          },
        ],
      },
    };
  }
  return scenery;
}
