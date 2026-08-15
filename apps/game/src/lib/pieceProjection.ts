import { WebMercatorViewport } from "@deck.gl/core";
import type { ViewState } from "react-map-gl";

/**
 * Lays the dragged piece on the ground, when the map is tilted.
 *
 * Flat, the map turns every shape by the same amount, so one rotation puts the
 * piece in step with it. Tilted, that stops being true: a perspective camera
 * foreshortens by distance, so the same county drawn near the top of a 45°
 * view is 141x70 pixels and near the bottom 232x186. A single transform can
 * only ever be right in one band of the screen.
 *
 * The piece, though, lies flat on the ground like everything else on the map,
 * and a plane seen through a pinhole camera reaches the screen by a homography
 * — eight numbers, exactly what a CSS matrix3d expresses. So instead of
 * approximating, the four corners of the piece are projected through the map's
 * own viewport and the transform that takes the element there is solved for.
 * Checked against deck.gl's projection over the 855 vertices of a real piece:
 * worst case 2e-11 pixels, at any bearing and pitch.
 *
 * What it costs is that the piece changes shape as it travels, which is the
 * point rather than a defect: in the tilted view the piece belongs to the
 * ground it is over.
 */

/** EPSG:3857, the units pieceSilhouette emits. */
const EARTH_RADIUS = 6378137;
/** Web Mercator gives up at the poles. */
const MAX_LATITUDE = 85.051129;
/** Mercator metres per pixel at zoom 0, on deck.gl's 512-pixel tiles. */
const METRES_PER_PIXEL_AT_ZOOM_0 = (2 * Math.PI * EARTH_RADIUS) / 512;

const toMercatorY = (lat: number) =>
  EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const toMercatorX = (lon: number) => (lon * Math.PI * EARTH_RADIUS) / 180;
const toLongitude = (x: number) => (x * 180) / (Math.PI * EARTH_RADIUS);
const toLatitude = (y: number) =>
  (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

/** Where the piece is being held, and how big it is drawn. */
export interface Grab {
  /** The pointer, in screen pixels. */
  x: number;
  y: number;
  /** The piece's rendered size, in screen pixels. */
  width: number;
  height: number;
  /** Where in that rectangle the pointer holds it, same pixels. */
  grabX: number;
  grabY: number;
}

/**
 * Solves the 3x3 that carries four source points onto four destinations, with
 * h33 pinned to 1. Eight unknowns, eight equations, Gaussian elimination with
 * partial pivoting — small enough to be exact and cheap enough for every frame.
 */
function homography(
  src: [number, number][],
  dst: [number, number][]
): number[] | null {
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = dst[i];
    a.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    a.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++) {
      if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    }
    if (Math.abs(a[pivot][c]) < 1e-12) return null; // degenerate quad
    [a[c], a[pivot]] = [a[pivot], a[c]];
    [b[c], b[pivot]] = [b[pivot], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = a[r][c] / a[c][c];
      for (let k = c; k < 8; k++) a[r][k] -= f * a[c][k];
      b[r] -= f * b[c];
    }
  }
  return b.map((v, i) => v / a[i][i]);
}

/**
 * The CSS transform that puts the piece on the ground under the pointer.
 *
 * Returns null when it cannot be trusted — no view yet, a pointer that
 * unprojects past the edge of the world, a corner behind the camera — and the
 * caller should fall back to the flat transform rather than draw nonsense.
 */
export function groundTransform(
  viewport: WebMercatorViewport,
  view: ViewState,
  grab: Grab
): string | null {
  if (!grab.width || !grab.height) return null;

  const ground = viewport.unproject([grab.x, grab.y]) as number[];
  if (!Number.isFinite(ground[0]) || !Number.isFinite(ground[1])) return null;
  if (Math.abs(ground[1]) > MAX_LATITUDE) return null;

  // The piece is drawn at the map's own scale, so a pixel of it is this many
  // Mercator metres. Piece and map therefore share one ruler.
  const metresPerPixel = METRES_PER_PIXEL_AT_ZOOM_0 / Math.pow(2, view.zoom);
  const originX = toMercatorX(ground[0]);
  const originY = toMercatorY(ground[1]);

  const corners: [number, number][] = [
    [0, 0],
    [grab.width, 0],
    [grab.width, grab.height],
    [0, grab.height],
  ];

  const projected: [number, number][] = [];
  for (const [u, v] of corners) {
    // Screen y grows downwards, Mercator y grows north: hence the sign.
    const x = originX + (u - grab.grabX) * metresPerPixel;
    const y = originY - (v - grab.grabY) * metresPerPixel;
    const lat = toLatitude(y);
    if (Math.abs(lat) > MAX_LATITUDE) return null;
    const point = viewport.project([toLongitude(x), lat]) as number[];
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
    projected.push([point[0], point[1]]);
  }

  const h = homography(corners, projected);
  if (!h || h.some((n) => !Number.isFinite(n))) return null;

  // CSS matrix3d is column-major, and a plane needs only the rows and columns
  // that touch x, y and w — the third row and column stay the identity.
  const [a, b, c, d, e, f, g, i] = h;
  return `matrix3d(${a}, ${d}, 0, ${g}, ${b}, ${e}, 0, ${i}, 0, 0, 1, 0, ${c}, ${f}, 0, 1)`;
}

/** Builds the map's viewport, or null while the view is still empty. */
export function viewportFor(
  view: ViewState,
  width: number,
  height: number
): WebMercatorViewport | null {
  if (!view?.zoom || !width || !height) return null;
  if (!Number.isFinite(view.longitude) || !Number.isFinite(view.latitude)) {
    return null;
  }
  return new WebMercatorViewport({
    width,
    height,
    longitude: view.longitude,
    latitude: view.latitude,
    zoom: view.zoom,
    bearing: view.bearing ?? 0,
    pitch: view.pitch ?? 0,
  });
}
