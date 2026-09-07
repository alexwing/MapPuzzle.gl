/**
 * Writes data/maps/world_backdrop.geojson: the ground under the Equal Earth view.
 *
 * In Mercator the map sits on CARTO's vector tiles, which give every puzzle its
 * surroundings. Tiles are Mercator by construction and cannot be bent into
 * another projection, so the Equal Earth view draws its own ground, and this
 * file is it — three kinds of feature, told apart by `properties.kind`:
 *
 *   land   the world's countries from world_borders.geojson, simplified to a
 *          0.03° tolerance (about 3 km), islets under 0.1° across dropped, each
 *          with `p`, a point inside it, so the game can tell which countries a
 *          puzzle already covers and leave those to the puzzle's own outlines;
 *   lake   Natural Earth's 1:50m lakes, all of them, at 0.02°;
 *   river  Natural Earth's 1:50m rivers — not its lake centrelines, the lakes
 *          cover those — at 0.02°, with `w`, the width in pixels each is drawn
 *          at, from its scalerank.
 *
 * Coordinates are kept to two decimals, about a kilometre, a third of the
 * coarsest tolerance. The land carries no borders and nothing carries a name:
 * it is scenery, and the puzzle draws its own lines on top of it.
 *
 * Natural Earth is public domain. Its two files are downloaded once, from the
 * v5.1.2 tag of its repository, into data/shapefiles/natural-earth/, which is
 * where the other source material lives and is not versioned.
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
const landSource = path.join(root, "data/maps/world_borders.geojson");
const naturalEarthDir = path.join(root, "data/shapefiles/natural-earth");
const target = path.join(root, "data/maps/world_backdrop.geojson");

const NATURAL_EARTH =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/";
const LAKES = "ne_50m_lakes.geojson";
const RIVERS = "ne_50m_rivers_lake_centerlines.geojson";

/** Simplification tolerances, in degrees. */
const LAND_TOLERANCE = 0.03;
const WATER_TOLERANCE = 0.02;
/** Rings narrower than this, in degrees, are below a pixel at any zoom a backdrop is seen at. */
const MIN_LAND_RING = 0.1;
const MIN_LAKE_RING = 0.03;
/** Decimals kept in coordinates: 0.01° is about a kilometre. */
const DECIMALS = 2;
/** And in the interior points, which have to stay inside small countries. */
const POINT_DECIMALS = 4;

/** How wide a river is drawn, in pixels, by Natural Earth's scalerank (1 is the largest). */
const riverWidth = (scalerank) => (scalerank <= 2 ? 1.6 : scalerank <= 4 ? 1.2 : 1);

async function naturalEarth(name) {
  const file = path.join(naturalEarthDir, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(naturalEarthDir, { recursive: true });
    const response = await fetch(NATURAL_EARTH + name);
    if (!response.ok) {
      throw new Error(`${NATURAL_EARTH}${name}: HTTP ${response.status}`);
    }
    fs.writeFileSync(file, await response.text());
    console.log(`downloaded ${name}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

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

/** Polygons and multipolygons alike, as a list of polygons, each a list of rings. */
function polygonsOf(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

/** Shoelace, unsigned: only compared against itself. */
function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(sum / 2);
}

/** Where a ring crosses the horizontal line at `y`, as sorted x's. */
function crossings(ring, y) {
  const xs = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
  }
  return xs.sort((a, b) => a - b);
}

/**
 * A point inside the country, well away from its edges.
 *
 * The centroid will not do — a crescent's is in the sea — and a vertex will
 * not either: a vertex on a shared border belongs to the neighbour as much as
 * to the country, and the point exists to be tested against a puzzle's pieces,
 * which may be that neighbour. So: the largest polygon, the horizontal line
 * through the middle of it, and the midpoint of the widest run of land along
 * that line that does not fall in a hole.
 */
function interiorPoint(geometry) {
  const polygons = polygonsOf(geometry);
  const main = polygons.reduce((best, polygon) =>
    ringArea(polygon[0]) > ringArea(best[0]) ? polygon : best
  );
  const [outer, ...holes] = main;
  let minY = Infinity, maxY = -Infinity;
  for (const [, y] of outer) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  // A few lines rather than one, in case the middle one only meets a sliver.
  for (const fraction of [0.5, 0.4, 0.6, 0.3, 0.7]) {
    const y = minY + (maxY - minY) * fraction;
    const xs = crossings(outer, y);
    let best = null;
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x = (xs[i] + xs[i + 1]) / 2;
      const inHole = holes.some((hole) => turf.booleanPointInPolygon([x, y], turf.polygon([hole])));
      if (!inHole && (!best || xs[i + 1] - xs[i] > best.width)) {
        best = { point: [x, y], width: xs[i + 1] - xs[i] };
      }
    }
    if (best) return best.point;
  }
  return turf.pointOnFeature(geometry).geometry.coordinates;
}

/**
 * Simplifies an area and drops the rings that would not show. Holes lie inside
 * their outer ring, so when the outer ring goes they go with it. Null when
 * nothing is left.
 */
function simplifyArea(feature, tolerance, minRing) {
  const simplified = turf.simplify(feature, { tolerance, highQuality: false, mutate: false });
  const kept = polygonsOf(simplified.geometry)
    .map((rings) => rings.filter((ring) => extent(ring) >= minRing))
    .filter((rings) => rings.length > 0 && rings[0].length >= 4);
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
}

function simplifyLine(feature, tolerance) {
  return turf.simplify(feature, { tolerance, highQuality: false, mutate: false }).geometry;
}

const round = (value, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

function roundCoordinates(coordinates, decimals) {
  return typeof coordinates[0] === "number"
    ? coordinates.map((value) => round(value, decimals))
    : coordinates.map((inner) => roundCoordinates(inner, decimals));
}

function vertices(geometry) {
  let n = 0;
  const walk = (c) => {
    if (typeof c[0] === "number") n++;
    else for (const s of c) walk(s);
  };
  walk(geometry.coordinates);
  return n;
}

const world = JSON.parse(fs.readFileSync(landSource, "utf8"));
const [lakes, rivers] = await Promise.all([naturalEarth(LAKES), naturalEarth(RIVERS)]);

const features = [];
const count = { land: 0, lake: 0, river: 0 };
const points = { land: 0, lake: 0, river: 0 };
let dropped = 0;
let pointsInside = 0;

function add(kind, geometry, extra = {}) {
  features.push({
    type: "Feature",
    properties: { kind, ...extra },
    geometry: { type: geometry.type, coordinates: roundCoordinates(geometry.coordinates, DECIMALS) },
  });
  count[kind]++;
  points[kind] += vertices(geometry);
}

for (const feature of world.features) {
  const geometry = simplifyArea(feature, LAND_TOLERANCE, MIN_LAND_RING);
  if (!geometry) {
    dropped++;
    continue;
  }
  // From the country as it really is, not as simplified: the point is tested
  // against puzzle pieces that were never simplified.
  const p = interiorPoint(feature.geometry).map((value) => round(value, POINT_DECIMALS));
  if (turf.booleanPointInPolygon(p, feature, { ignoreBoundary: true })) pointsInside++;
  add("land", geometry, { p });
}
for (const feature of lakes.features) {
  const geometry = simplifyArea(feature, WATER_TOLERANCE, MIN_LAKE_RING);
  if (geometry) add("lake", geometry);
  else dropped++;
}
for (const feature of rivers.features) {
  // Lake centrelines run through the lakes, which are drawn already.
  if (!/^River/.test(feature.properties.featurecla)) continue;
  add("river", simplifyLine(feature, WATER_TOLERANCE), {
    w: riverWidth(feature.properties.scalerank),
  });
}

const json = JSON.stringify({ type: "FeatureCollection", features });
fs.writeFileSync(target, json + "\n");

console.log(
  `${path.relative(root, target)}: ` +
    `${count.land} land (${points.land} vertices, ${pointsInside} interior points strictly inside), ` +
    `${count.lake} lakes (${points.lake}), ` +
    `${count.river} rivers (${points.river}), ` +
    `${dropped} dropped, ${(json.length / 1024).toFixed(0)} KB`
);
