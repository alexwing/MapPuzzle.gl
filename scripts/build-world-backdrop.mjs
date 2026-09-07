/**
 * Writes data/maps/world_backdrop.geojson: the land under the Equal Earth view.
 *
 * In Mercator the map sits on CARTO's vector tiles, which give every puzzle its
 * surroundings. Tiles are Mercator by construction and cannot be bent into
 * another projection, so the Equal Earth view draws its own ground, and this
 * file is it: the world's countries from world_borders.geojson, simplified for
 * a backdrop — a 0.05° tolerance (about 5 km), islets under 0.1° across
 * dropped, coordinates to two decimals — which takes it from 2.2 MB to under
 * half a megabyte. Fill only, no borders and no properties: it is scenery, and
 * the puzzle draws its own lines on top of it.
 *
 *   node scripts/build-world-backdrop.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const turf = require("@turf/turf");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "data/maps/world_borders.geojson");
const target = path.join(root, "data/maps/world_backdrop.geojson");

/** Simplification tolerance, in degrees. */
const TOLERANCE = 0.05;
/** Rings narrower than this, in degrees, are below a pixel at any zoom a backdrop is seen at. */
const MIN_RING_EXTENT = 0.1;
/** Decimals kept: 0.01° is about a kilometre, a fifth of the tolerance. */
const DECIMALS = 2;

function extent(ring) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

const world = JSON.parse(fs.readFileSync(source, "utf8"));
const features = [];
let vertices = 0;
let dropped = 0;

for (const feature of world.features) {
  const simplified = turf.simplify(feature, { tolerance: TOLERANCE, highQuality: false, mutate: false });
  const polygons =
    simplified.geometry.type === "Polygon"
      ? [simplified.geometry.coordinates]
      : simplified.geometry.coordinates;
  const kept = polygons
    .map((rings) => rings.filter((ring) => extent(ring) >= MIN_RING_EXTENT))
    .filter((rings) => rings.length > 0 && rings[0].length >= 4);
  dropped += polygons.length - kept.length;
  if (kept.length === 0) continue;
  for (const rings of kept) for (const ring of rings) vertices += ring.length;
  features.push({
    type: "Feature",
    properties: {},
    geometry: { type: "MultiPolygon", coordinates: kept },
  });
}

const factor = Math.pow(10, DECIMALS);
const json = JSON.stringify(
  { type: "FeatureCollection", features },
  (key, value) => (typeof value === "number" ? Math.round(value * factor) / factor : value)
);
fs.writeFileSync(target, json + "\n");

const before = fs.statSync(source).size;
console.log(
  `${path.relative(root, target)}: ${features.length} countries, ${vertices} vertices, ` +
    `${dropped} polygons dropped, ${(before / 1024).toFixed(0)} KB -> ${(json.length / 1024).toFixed(0)} KB`
);
