/**
 * The share card for a puzzle: what WhatsApp, X or a chat window shows when
 * someone pastes a link.
 *
 * The hero is the map's own outline, projected the way the game projects it.
 * It is the only asset here that is vector, unique per puzzle and already in
 * the repository — a flag alone would not tell Spanish Provinces from Spanish
 * Autonomous Regions, and the flags are 64 px raster, far too small to carry a
 * 1200 px card. As a badge beside the title, 64 px is plenty.
 *
 * Text is drawn from the project's own fonts, instantiated as static weights in
 * assets/fonts. They cannot be used as they ship: they are variable woff2, and
 * a rasteriser resolves fonts through the system, so asking for "Outfit" got
 * the default sans — and Outfit's default instance is Thin, which would have
 * been quietly wrong rather than obviously broken.
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import opentype from "opentype.js";

/** Facebook, X, LinkedIn and WhatsApp all read this size. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const EARTH_RADIUS = 6378137;
const LAT_LIMIT = 85.051129;

const FONT_DIR = path.resolve(__dirname, "../../assets/fonts");
const TITLE_FONT = path.join(FONT_DIR, "outfit-700.ttf");
const BODY_FONT = path.join(FONT_DIR, "inter-400.ttf");
const BODY_BOLD_FONT = path.join(FONT_DIR, "inter-600.ttf");

/** Straight from the game's dark theme, so a shared card looks like the game. */
const INK = "#f8fafc";
const MUTED = "#94a3b8";
const DIM = "#64748b";

export interface CardInput {
  /** The puzzle's display name, as the heading. */
  name: string;
  /** Absolute path to the puzzle's geojson. */
  geojson: string;
  /** Absolute path to the puzzle's icon, usually a 64px flag. Optional. */
  icon?: string;
  /** Absolute path to the site logo. Optional. */
  logo?: string;
  /** Flags quiz cards say something different underneath the name. */
  isQuiz?: boolean;
}

interface TextLayer {
  input: Buffer;
  top: number;
  left: number;
}

const toMercator = (lon: number, lat: number): [number, number] => [
  (EARTH_RADIUS * lon * Math.PI) / 180,
  EARTH_RADIUS *
    Math.log(
      Math.tan(
        Math.PI / 4 +
          ((Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, lat)) * Math.PI) / 180) / 2
      )
    ),
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function ringsOf(geometry: any): number[][][] {
  const out: number[][][] = [];
  if (!geometry) return out;
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  if (!Array.isArray(polygons)) return out;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) if (Array.isArray(ring)) out.push(ring);
  }
  return out;
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const boxOf = (ring: [number, number][]): Box => {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [x, y] of ring) {
    if (x < box.minX) box.minX = x;
    if (x > box.maxX) box.maxX = x;
    if (y < box.minY) box.minY = y;
    if (y > box.maxY) box.maxY = y;
  }
  return box;
};

/** Shoelace, absolute: only the size matters, not the winding. */
const areaOf = (ring: [number, number][]): number => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(sum) / 2;
};

/**
 * The extent worth framing, which is not always the whole extent.
 *
 * Spain owns the Canaries, France owns islands in three oceans, and fitting
 * every last one leaves the part anybody recognises small and off-centre, with
 * specks in the corners. So it starts from the largest landmass and keeps
 * absorbing whatever falls near what it has — the Balearics get in, the Canaries
 * do not — and anything left outside is simply clipped away.
 */
function framedExtent(rings: [number, number][][]): Box {
  const boxes = rings.map(boxOf);
  const areas = rings.map(areaOf);
  let seed = 0;
  for (let i = 1; i < areas.length; i++) if (areas[i] > areas[seed]) seed = i;

  const frame: Box = { ...boxes[seed] };
  const taken = new Set<number>([seed]);
  for (let pass = 0; pass < 6; pass++) {
    const marginX = (frame.maxX - frame.minX) * 0.25;
    const marginY = (frame.maxY - frame.minY) * 0.25;
    let grew = false;
    for (let i = 0; i < boxes.length; i++) {
      if (taken.has(i)) continue;
      const b = boxes[i];
      const near =
        b.minX <= frame.maxX + marginX &&
        b.maxX >= frame.minX - marginX &&
        b.minY <= frame.maxY + marginY &&
        b.maxY >= frame.minY - marginY;
      if (!near) continue;
      taken.add(i);
      frame.minX = Math.min(frame.minX, b.minX);
      frame.minY = Math.min(frame.minY, b.minY);
      frame.maxX = Math.max(frame.maxX, b.maxX);
      frame.maxY = Math.max(frame.maxY, b.maxY);
      grew = true;
    }
    if (!grew) break;
  }
  return frame;
}

/**
 * The whole map as one SVG path, fitted into a box.
 *
 * Points closer together than half a pixel are dropped and rings smaller than a
 * pixel are skipped: at this size they are invisible, and without that the
 * world map's path runs to megabytes and takes seconds to rasterise.
 */
export function outlinePath(geojson: any, width: number, height: number): string {
  const rings: [number, number][][] = [];
  for (const feature of geojson?.features ?? []) {
    for (const ring of ringsOf(feature.geometry)) {
      if (ring.length < 4) continue;
      rings.push(ring.map(([lon, lat]: number[]) => toMercator(lon, lat)));
    }
  }
  if (rings.length === 0) return "";

  const { minX, minY, maxX, maxY } = framedExtent(rings);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (!(spanX > 0) || !(spanY > 0)) return "";

  const scale = Math.min(width / spanX, height / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const project = ([x, y]: [number, number]): [number, number] => [
    offsetX + (x - minX) * scale,
    offsetY + (maxY - y) * scale,
  ];

  const parts: string[] = [];
  for (const ring of rings) {
    const points: [number, number][] = [];
    let last: [number, number] | null = null;
    for (const point of ring) {
      const p = project(point);
      if (!last || Math.abs(p[0] - last[0]) > 0.5 || Math.abs(p[1] - last[1]) > 0.5) {
        points.push(p);
        last = p;
      }
    }
    if (points.length < 3) continue;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < 1.5 && Math.max(...ys) - Math.min(...ys) < 1.5) {
      continue;
    }
    parts.push(
      "M" + points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z"
    );
  }
  return parts.join("");
}

/**
 * Text as an SVG path.
 *
 * Not as a rendered image: the rasteriser resolves fonts through a
 * process-wide cache, and across a run of a hundred cards it would
 * intermittently fall back to a default face — Croatia came out in Inter and
 * Spain in a monospace, from the same code, in the same batch. Outlines are
 * decided here, once, and what the rasteriser receives is geometry.
 */
const fonts = new Map<string, opentype.Font>();
function font(file: string): opentype.Font {
  let loaded = fonts.get(file);
  if (!loaded) {
    loaded = opentype.parse(toArrayBuffer(fs.readFileSync(file)));
    fonts.set(file, loaded);
  }
  return loaded;
}

/** Node Buffers are views into a shared pool; opentype needs the bytes alone. */
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

interface Drawn {
  /** The <path> element, positioned with its left edge at x and baseline at y. */
  svg: string;
  width: number;
  /** Distance from the baseline to the top of the tallest glyph. */
  ascent: number;
}

/**
 * The outline as path data.
 *
 * Written out here rather than with opentype's own toPathData, which emitted a
 * literal NaN into the middle of a heading — the commands it holds are all
 * valid numbers, only its serialiser trips. A rasteriser stops reading a path
 * at the first token it cannot parse, so the card came out with the title cut
 * mid-word and nothing anywhere said why.
 */
function pathData(path: opentype.Path, decimals = 2): string {
  const n = (v: number): string => {
    if (!Number.isFinite(v)) throw new Error(`Glyph outline produced ${v}`);
    return String(Number(v.toFixed(decimals)));
  };
  let d = "";
  for (const c of path.commands as any[]) {
    if (c.type === "M") d += `M${n(c.x)} ${n(c.y)}`;
    else if (c.type === "L") d += `L${n(c.x)} ${n(c.y)}`;
    else if (c.type === "C") d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Q") d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}

function drawText(
  text: string,
  fontFile: string,
  size: number,
  colour: string,
  x: number,
  baseline: number
): Drawn {
  const face = font(fontFile);
  const path = face.getPath(text, x, baseline, size);
  const box = path.getBoundingBox();
  return {
    svg: `<path d="${pathData(path)}" fill="${colour}"/>`,
    width: Number.isFinite(box.x2 - box.x1) ? box.x2 - box.x1 : 0,
    ascent: Number.isFinite(baseline - box.y1) ? baseline - box.y1 : size,
  };
}

/** Measures without drawing, to choose a size that fits. */
function widthOf(text: string, fontFile: string, size: number): number {
  return font(fontFile).getAdvanceWidth(text, size);
}

/**
 * Splits a heading into at most two lines, on the space nearest the middle,
 * which reads better than filling the first line to the brim.
 */
function twoLines(text: string): [string, string] {
  const words = text.split(/\s+/);
  if (words.length < 2) return [text, ""];
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(
      words.slice(0, i).join(" ").length - words.slice(i).join(" ").length
    );
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export async function buildCard(input: CardInput): Promise<Buffer> {
  const geojson = JSON.parse(fs.readFileSync(input.geojson, "utf8"));
  const pieces = geojson?.features?.length ?? 0;
  const mapPath = outlinePath(geojson, 520, 430);

  /* The heading shrinks a step at a time before it is allowed to wrap, and
     wraps at most once: three lines of title would crowd the flag below. */
  const HEAD_LEFT = 110;
  const HEAD_MAX = 470;
  const text: string[] = [];
  let size = 62;
  while (size > 40 && widthOf(input.name, TITLE_FONT, size) > HEAD_MAX) size -= 6;

  let subtitleBaseline: number;
  if (widthOf(input.name, TITLE_FONT, size) <= HEAD_MAX) {
    text.push(drawText(input.name, TITLE_FONT, size, INK, HEAD_LEFT, 128).svg);
    subtitleBaseline = 180;
  } else {
    const [first, second] = twoLines(input.name);
    let two = 46;
    while (
      two > 32 &&
      Math.max(widthOf(first, TITLE_FONT, two), widthOf(second, TITLE_FONT, two)) > HEAD_MAX
    ) {
      two -= 4;
    }
    text.push(drawText(first, TITLE_FONT, two, INK, HEAD_LEFT, 110).svg);
    text.push(drawText(second, TITLE_FONT, two, INK, HEAD_LEFT, 110 + two * 1.15).svg);
    subtitleBaseline = 110 + two * 1.15 + 52;
  }

  text.push(
    drawText(
      input.isQuiz
        ? `${pieces} flag${pieces === 1 ? "" : "s"} to learn`
        : `${pieces} region${pieces === 1 ? "" : "s"} to place`,
      BODY_FONT,
      30,
      MUTED,
      HEAD_LEFT + 2,
      subtitleBaseline
    ).svg
  );
  text.push(drawText("mappuzzle.xyz", BODY_BOLD_FONT, 28, INK, 70, 545).svg);
  text.push(
    drawText(
      input.isQuiz ? "Free interactive flag quizzes" : "Free interactive map puzzles",
      BODY_FONT,
      21,
      DIM,
      72,
      578
    ).svg
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="72%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#090d16" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <clipPath id="frame"><rect x="0" y="0" width="520" height="430"/></clipPath>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#090d16"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glow)"/>
  <g transform="translate(620,100)" clip-path="url(#frame)">
    <path d="${mapPath}" fill="url(#land)" stroke="#93c5fd" stroke-width="1.5" stroke-linejoin="round"/>
  </g>
  <rect x="70" y="70" width="6" height="${subtitleBaseline - 58}" rx="3" fill="#3b82f6"/>
  ${text.join(" ")}
</svg>`;

  const layers: TextLayer[] = [];
  if (input.icon && fs.existsSync(input.icon)) {
    layers.push({
      input: await sharp(input.icon)
        .resize(112, 112, { fit: "inside", kernel: "lanczos3" })
        .toBuffer(),
      top: 300,
      left: 70,
    });
  }
  if (input.logo && fs.existsSync(input.logo)) {
    layers.push({
      input: await sharp(input.logo).resize(64, 64).toBuffer(),
      top: 512,
      left: 1060,
    });
  }

  // A rasteriser reads a path until it hits something it cannot parse and then
  // stops, silently, mid-shape. Better to fail here than to ship a card with
  // half a title on it.
  if (svg.includes("NaN") || svg.includes("undefined")) {
    throw new Error(`Card for "${input.name}" produced an unparseable value`);
  }

  const card = sharp(Buffer.from(svg));
  return (layers.length ? card.composite(layers) : card)
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}
