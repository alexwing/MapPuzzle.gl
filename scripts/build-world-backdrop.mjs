/**
 * Writes data/maps/world_backdrop.geojson: the ground under the Equal Earth view.
 *
 * In Mercator the map sits on CARTO's vector tiles, which give every puzzle its
 * surroundings. Tiles are Mercator by construction and cannot be bent into
 * another projection, so the Equal Earth view draws its own ground, and this
 * file is it — three kinds of feature, told apart by `properties.kind`:
 *
 *   land   the world's countries from world_borders.geojson, simplified to a
 *          0.05° tolerance (about 5 km), islets under 0.1° across dropped;
 *   lake   Natural Earth's 1:50m lakes, all of them, at 0.02°;
 *   river  Natural Earth's 1:50m rivers — not its lake centrelines, the lakes
 *          cover those — at 0.02°, with `w`, the width in pixels each is drawn
 *          at, from its scalerank.
 *
 * Coordinates are kept to two decimals, about a kilometre, a fifth of the
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
const LAND_TOLERANCE = 0.05;
const WATER_TOLERANCE = 0.02;
/** Rings narrower than this, in degrees, are below a pixel at any zoom a backdrop is seen at. */
const MIN_LAND_RING = 0.1;
const MIN_LAKE_RING = 0.03;
/** Decimals kept: 0.01° is about a kilometre. */
const DECIMALS = 2;

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

function add(kind, geometry, extra = {}) {
  features.push({ type: "Feature", properties: { kind, ...extra }, geometry });
  count[kind]++;
  points[kind] += vertices(geometry);
}

for (const feature of world.features) {
  const geometry = simplifyArea(feature, LAND_TOLERANCE, MIN_LAND_RING);
  if (geometry) add("land", geometry);
  else dropped++;
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

const factor = Math.pow(10, DECIMALS);
const json = JSON.stringify(
  { type: "FeatureCollection", features },
  (key, value) => (typeof value === "number" ? Math.round(value * factor) / factor : value)
);
fs.writeFileSync(target, json + "\n");

console.log(
  `${path.relative(root, target)}: ` +
    `${count.land} land (${points.land} vertices), ` +
    `${count.lake} lakes (${points.lake}), ` +
    `${count.river} rivers (${points.river}), ` +
    `${dropped} dropped, ${(json.length / 1024).toFixed(0)} KB`
);
