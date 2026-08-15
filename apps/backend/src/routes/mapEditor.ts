import type { FlagsIcons, PieceProps } from "@mappuzzle/shared";
import express from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import CustomWiki from "../models/customWiki";
import CustomCentroids from "../models/customCentroids";
import Countries from "../models/countries";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import * as fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";
import ViewState from "../models/viewState";
import { ASSETS_DIR, customFlagsDir, ensureDir, flagsDir, ogDir, siteLogoPath, sitemapPaths } from "../config/paths";
import { buildCard } from "../lib/ogImage";
import { adjacency, areaOf, centreComputed, centreFromCurated } from "../lib/pieceGeometry";
import { startProgress } from "../lib/progress";

// eslint-disable-next-line new-cap
const mapEditor = express.Router();
// Route: <HOST>:PORT/api/mapEditor

//express enable upload files
express.json({ limit: "125mb" });
express.urlencoded({ limit: "125mb", extended: true });

mapEditor.post("/savePuzzle", (req, res) => {
  const { puzzle } = req.body;
  console.log("puzzle:" + JSON.stringify(puzzle));
  const puzzleRepository = connection!.getRepository(Puzzles);
  puzzleRepository.save(puzzle);
  const viewState = new ViewState();
  viewState.id = puzzle.id;
  viewState.latitude = puzzle.view_state.latitude;
  viewState.longitude = puzzle.view_state.longitude;
  viewState.zoom = puzzle.view_state.zoom;
  //save view state
  const viewStateRepository = connection!.getRepository(ViewState);
  viewStateRepository
    .save(viewState)
    .then(() => {
      res.json({
        success: true,
        msg: "Puzzle saved successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        msg: err.message,
      });
    });
});

mapEditor.post("/savePiece", async (req, res) => {
  const { pieceToSend } = req.body;
  const pieceProps: PieceProps = pieceToSend as PieceProps;

  // Both halves are awaited and answered once. This used to call res.json() in
  // each of two unawaited chains, so the second reply threw
  // ERR_HTTP_HEADERS_SENT and any failure was reported as success.
  try {
    await saveCustomWiki(pieceProps);
    await saveCustomCentroids(pieceProps);
    res.json({ success: true, msg: "Piece saved" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`savePiece failed: ${message}`);
    res.status(400).json({ success: false, msg: message });
  }
});

mapEditor.post("/replacePieceFlag", async (req, res) => {
  try {
    const puzzleId = Number(req.body?.id);
    const cartodbId = Number(req.body?.cartodb_id);
    const imageUrl = String(req.body?.imageUrl ?? "").trim();
    if (!Number.isFinite(puzzleId) || !Number.isFinite(cartodbId)) {
      return res.status(400).json({ success: false, msg: "Missing id/cartodb_id" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploaded = (req as any).files?.file;
    const outDir = customFlagsDir(puzzleId);
    ensureDir(outDir);

    const basename = String(cartodbId);
    const originals = [".png", ".svg", ".jpg", ".jpeg"];
    originals.forEach((ext) => {
      const p = path.join(outDir, basename + ext);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    let sourceBuffer: Buffer;
    let ext = "";

    if (uploaded) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file = uploaded as any;
      sourceBuffer = file.data as Buffer;
      const lower = String(file.name ?? "").toLowerCase();
      const mime = String(file.mimetype ?? "").toLowerCase();
      if (lower.endsWith(".svg") || mime.includes("svg")) ext = "svg";
      if (lower.endsWith(".png") || mime.includes("png")) ext = "png";
      if (!ext) {
        return res.status(400).json({ success: false, msg: "Only .svg or .png are supported" });
      }
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok || !response.body) {
        return res.status(400).json({ success: false, msg: `Could not download image from URL (${response.status})` });
      }
      const mime = String(response.headers.get("content-type") ?? "").toLowerCase();
      let extGuess = "";
      try {
        const pathname = new URL(imageUrl).pathname.toLowerCase();
        if (pathname.endsWith(".svg")) extGuess = "svg";
        if (pathname.endsWith(".png")) extGuess = "png";
      } catch {
        // ignore URL parsing errors and keep mime-based guess
      }
      if (!extGuess && mime.includes("svg")) extGuess = "svg";
      if (!extGuess && mime.includes("png")) extGuess = "png";
      if (!extGuess) {
        return res.status(400).json({ success: false, msg: "URL must point to a .svg or .png image" });
      }
      ext = extGuess;
      sourceBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      return res.status(400).json({ success: false, msg: "Provide an image URL or upload a file" });
    }

    const sourcePath = path.join(outDir, `${basename}.${ext}`);
    // Uint8Array rather than the Buffer itself: the installed @types/node types
    // writeFileSync against ArrayBufferView, and Buffer no longer satisfies it.
    fs.writeFileSync(sourcePath, new Uint8Array(sourceBuffer));

    const sizes = [64, 128, 256, 512, 1024];
    for (const size of sizes) {
      const sizeDir = path.join(outDir, String(size));
      ensureDir(sizeDir);
      const thumbPath = path.join(sizeDir, `${basename}.png`);
      await sharp(sourceBuffer)
        .resize(size, size, { fit: "inside", withoutEnlargement: true })
        .png()
        .toFile(thumbPath);
    }

    res.json({
      success: true,
      msg: `Flag replaced for piece ${cartodbId} and thumbnails regenerated`,
      data: {
        id: puzzleId,
        cartodb_id: cartodbId,
        original: `${basename}.${ext}`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`replacePieceFlag failed: ${message}`);
    res.status(400).json({ success: false, msg: message });
  }
});

//get countries
mapEditor.get("/getCountries", async (_req, res) => {
  const countriesRepository = connection!.getRepository(Countries);
  //sorted by name
  const countries = await countriesRepository.find({
    order: {
      name: "ASC",
    },
  });
  res.json({
    success: true,
    msg: "Tables retrieved successfully",
    data: countries,
  });
});

//get countries flags
mapEditor.get("/getFlags", async (_req, res) => {
  const countriesRepository = connection!.getRepository(Countries);
  const countries = await countriesRepository.find({
    order: {
      name: "ASC",
    },
  });
  //find flags icons in the assets folder and compare filename with country alpha2
  const flagsPath = flagsDir();
  const flags = [] as FlagsIcons[];
  const flagsFiles = fs.readdirSync(flagsPath);
  flagsFiles.forEach((flag) => {
    const country = countries.find((country) => {
      return flag.slice(0, flag.indexOf(".")).toUpperCase()==country.alpha2;
    });
    if (country) {
      flags.push({
        name: country.name,
        url: "flags/" + flag,
      } as FlagsIcons);
    } else {
      flags.push({
        name: flag.slice(0, flag.indexOf(".")),
        url: "flags/" + flag,
      } as FlagsIcons);
    }
  });
  //sort flags by name
  flags.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
  res.json({
    success: true,
    msg: "Flags retrieved successfully",
    data: flags,
  });
});

//save custom wiki
/**
 * The keys are taken from the piece, not from the payload.
 *
 * Both of these used to fire an unawaited promise chain and then return
 * Promise.resolve() regardless, so the caller carried on before the write
 * happened and errors vanished. And they saved whatever object arrived: a piece
 * with no stored row yet arrives without id or cartodb_id, which is most of them
 * on a new map, so the insert had nothing to key on.
 */
function keysOf(pieceProps: PieceProps): { id: number; cartodb_id: number } {
  const id = Number(pieceProps.id);
  const cartodb_id = Number(pieceProps.properties?.cartodb_id);
  if (!Number.isFinite(id) || !Number.isFinite(cartodb_id)) {
    throw new Error(
      `A piece needs both a puzzle id and a cartodb_id to be saved, got ` +
        `${pieceProps.id} and ${pieceProps.properties?.cartodb_id}.`
    );
  }
  return { id, cartodb_id };
}

async function saveCustomWiki(pieceProps: PieceProps): Promise<void> {
  if (!pieceProps.customWiki) return;
  const keys = keysOf(pieceProps);
  const repository = connection!.getRepository(CustomWiki);
  if (pieceProps.customWiki.wiki) {
    await repository.save({ ...pieceProps.customWiki, ...keys });
    console.log(`Saved custom_wiki ${keys.id}/${keys.cartodb_id}`);
  } else {
    await repository.delete(keys);
    console.log(`Deleted custom_wiki ${keys.id}/${keys.cartodb_id}`);
  }
}
async function saveCustomCentroids(pieceProps: PieceProps): Promise<void> {
  const centroid = pieceProps.customCentroid;
  if (!centroid) return;
  const keys = keysOf(pieceProps);
  const repository = connection!.getRepository(CustomCentroids);
  // 0/0 means "no offset", which is the absence of a row rather than a stored
  // zero: the game falls back to centring the piece on the cursor.
  if (centroid.left !== 0 || centroid.top !== 0) {
    await repository.save({ ...centroid, ...keys });
    console.log(
      `Saved custom_centroids ${keys.id}/${keys.cartodb_id} ` +
        `left=${centroid.left} top=${centroid.top}`
    );
  } else {
    await repository.delete(keys);
    console.log(`Deleted custom_centroids ${keys.id}/${keys.cartodb_id}`);
  }
}
interface Link {
  url: string;
  changefreq: string;
  priority: number;
}

const SITE_HOST = "https://mappuzzle.xyz";

/**
 * A puzzle's canonical address.
 *
 * The build prerenders a real page per puzzle at these paths, so the sitemap
 * has to name them and not the older /?map= form, or it would be advertising
 * pages that declare a different URL as canonical. The same rule lives in
 * scripts/prerender.mjs and in the game's Utils.tsx: all three change together.
 */
const puzzlePath = (slug: string, isQuiz = false): string =>
  `/${isQuiz ? "flag-quiz" : "map"}/${slug.replace(/_/g, "-")}/`;

mapEditor.get("/generateSitemap", async (_req, res) => {
  const pieces = await connection!.getRepository(Puzzles).find();
  //create links from pieces format  const links = [{ url: '/page-1/',  changefreq: 'daily', priority: 0.3  }]
  // The home page first, as scripts/prerender.mjs also lists it; without it the
  // two generators disagree by one entry.
  let links: Link[] = [
    { url: `${SITE_HOST}/`, changefreq: "weekly", priority: 1.0 } as Link,
  ];
  links.push(
    ...pieces.map((piece) => {
      return {
        url: `${SITE_HOST}${puzzlePath(piece.url)}`,
        changefreq: "monthly",
        priority: 0.8,
      } as Link;
    })
  );

  //links to flagsQuiz
  const linksQuiz: Link[] = [];
  //foreach link in linksQuiz add to links
  pieces.forEach((piece) => {
    if (piece.enableFlags === true) {
      links.push({
        url: `${SITE_HOST}${puzzlePath(piece.url, true)}`,
        changefreq: "monthly",
        priority: 0.8,
      } as Link);
    }
  });
  

  if (linksQuiz){
    links = links.concat(linksQuiz as Link[]);
  } 
  const stream = new SitemapStream({ hostname: SITE_HOST });

  const sitemap = await streamToPromise(Readable.from(links).pipe(stream)).then(
    (sm) => sm.toString()
  );
  //write links to stream
  links.forEach((link) => stream.write(link));
  //end stream
  stream.end();
  //send sitemap
  res.header("Content-Type", "application/xml");
  res.send(sitemap);

  for (const file of sitemapPaths()) {
    fs.writeFile(file, sitemap, function (err: any) {
      if (err) return console.log(err);
      console.log(`${file} written`);
    });
  }
});

mapEditor.get("/wikiRender", async (req, res) => {
  try {
    const raw = String(req.query.title ?? "").trim();
    if (!raw) {
      return res.status(400).send("Missing title");
    }
    const title = (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })();

    const sourceUrl =
      "https://en.wikipedia.org/w/index.php?title=" +
      encodeURIComponent(title) +
      "&action=render";

    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "MapPuzzle/0.2 (https://mappuzzle.xyz; map puzzle editor)",
        Accept: "text/html",
      },
    });
    if (!response.ok) {
      return res.status(502).send(`Wikipedia returned ${response.status}`);
    }
    const html = await response.text();
    // A base tag keeps relative links and assets pointing to Wikipedia.
    const withBase = html.replace(
      /<head([^>]*)>/i,
      '<head$1><base href="https://en.wikipedia.org/">'
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(withBase);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).send(message);
  }
});

/**
 * Builds a share card for every puzzle.
 *
 * One pass over the catalogue: a card per map, and another for each puzzle that
 * has flags, since the flags quiz is a separate address with a separate page.
 * The prerender step points each page's og:image at what this writes.
 */
mapEditor.get("/generateOgImages", async (_req, res) => {
  const progress = startProgress(res);
  const puzzles = await connection!.getRepository(Puzzles).find();
  const logo = siteLogoPath();

  const jobs: { puzzle: Puzzles; isQuiz: boolean }[] = [];
  for (const puzzle of puzzles) {
    jobs.push({ puzzle, isQuiz: false });
    if (puzzle.enableFlags === true) jobs.push({ puzzle, isQuiz: true });
  }

  let written = 0;
  const failures: string[] = [];
  let done = 0;

  for (const { puzzle, isQuiz } of jobs) {
    done++;
    progress.step(done, jobs.length, `${puzzle.name}${isQuiz ? " (flags)" : ""}`);
    try {
      const geojson = path.join(ASSETS_DIR, String(puzzle.data));
      if (!fs.existsSync(geojson)) {
        failures.push(`${puzzle.name}: no geojson at ${puzzle.data}`);
        continue;
      }
      const card = await buildCard({
        name: String(puzzle.name),
        geojson,
        icon: puzzle.icon ? path.join(ASSETS_DIR, String(puzzle.icon)) : undefined,
        logo,
        isQuiz,
        // 128px: big enough for a cell in the panel, small enough that a
        // hundred of them do not take a minute to composite.
        pieceFlags: isQuiz ? path.join(customFlagsDir(puzzle.id), "128") : undefined,
      });
      const dir = ogDir(isQuiz ? "flag-quiz" : "map");
      ensureDir(dir);
      // Uint8Array, for the same reason as the flag writer above: these
      // @types/node no longer accept a Buffer here.
      fs.writeFileSync(
        path.join(dir, `${String(puzzle.url).replace(/_/g, "-")}.png`),
        new Uint8Array(card)
      );
      written++;
    } catch (err) {
      failures.push(`${puzzle.name}: ${(err as Error).message}`);
    }
  }

  progress.finish({
    success: failures.length === 0,
    msg:
      `${written} share card${written === 1 ? "" : "s"} written` +
      (failures.length > 0 ? `, ${failures.length} failed` : ""),
    failures,
    counts: { written, failed: failures.length },
  });
});

/**
 * Works out, for every piece of every puzzle, where its centre is, how big it
 * is and what it touches.
 *
 * The maps carry geometry, a name and a colour, and the games being planned
 * need all three of these — a game of pointing at a region needs its centre, a
 * game of comparing sizes needs its area, and a game of naming neighbours needs
 * to know who they are. All derivable, so derived once, here.
 *
 * The tables are created if they are not there: this connection has no
 * synchronise and the project has no migrations, and two tables written by one
 * job did not seem worth introducing either.
 */
mapEditor.get("/enrichPieces", async (_req, res) => {
  const progress = startProgress(res);
  const db = connection!;

  await db.query(`CREATE TABLE IF NOT EXISTS piece_geo (
    id INTEGER NOT NULL,
    cartodb_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    centre_source TEXT NOT NULL,
    area_m2 REAL NOT NULL,
    PRIMARY KEY (id, cartodb_id)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS piece_edges (
    id INTEGER NOT NULL,
    cartodb_id_a INTEGER NOT NULL,
    cartodb_id_b INTEGER NOT NULL,
    PRIMARY KEY (id, cartodb_id_a, cartodb_id_b)
  )`);

  const puzzles = await db.getRepository(Puzzles).find();
  const centroids = await db.getRepository(CustomCentroids).find();
  const curated = new Map<string, { left: number; top: number }>();
  for (const row of centroids) {
    // (-50, -50) is the default the editor hands out, not a decision anybody
    // made, so it does not count as curated.
    if (Number(row.left) === -50 && Number(row.top) === -50) continue;
    curated.set(`${row.id}:${row.cartodb_id}`, { left: Number(row.left), top: Number(row.top) });
  }

  let pieces = 0;
  let fromCurated = 0;
  let edges = 0;
  const failures: string[] = [];
  let done = 0;

  for (const puzzle of puzzles) {
    done++;
    progress.step(done, puzzles.length, String(puzzle.name));
    try {
      const file = path.join(ASSETS_DIR, String(puzzle.data));
      if (!fs.existsSync(file)) {
        failures.push(`${puzzle.name}: no geojson at ${puzzle.data}`);
        continue;
      }
      const geojson = JSON.parse(fs.readFileSync(file, "utf8"));
      const features = (geojson.features ?? [])
        .map((f: any) => ({
          cartodbId: Number(f?.properties?.cartodb_id),
          geometry: f?.geometry,
        }))
        .filter((f: any) => Number.isFinite(f.cartodbId) && f.geometry);

      await db.query("DELETE FROM piece_geo WHERE id = ?", [puzzle.id]);
      await db.query("DELETE FROM piece_edges WHERE id = ?", [puzzle.id]);

      for (const feature of features) {
        const hand = curated.get(`${puzzle.id}:${feature.cartodbId}`);
        const point =
          (hand && centreFromCurated(feature.geometry, hand.left, hand.top)) ||
          centreComputed(feature.geometry);
        if (!point) {
          failures.push(`${puzzle.name} piece ${feature.cartodbId}: no centre`);
          continue;
        }
        const source = hand && centreFromCurated(feature.geometry, hand.left, hand.top)
          ? "curated"
          : "computed";
        if (source === "curated") fromCurated++;
        await db.query(
          "INSERT INTO piece_geo (id, cartodb_id, lat, lon, centre_source, area_m2) VALUES (?, ?, ?, ?, ?, ?)",
          [puzzle.id, feature.cartodbId, point[1], point[0], source, areaOf(feature.geometry)]
        );
        pieces++;
      }

      for (const [a, b] of adjacency(features)) {
        await db.query(
          "INSERT INTO piece_edges (id, cartodb_id_a, cartodb_id_b) VALUES (?, ?, ?)",
          [puzzle.id, a, b]
        );
        edges++;
      }
    } catch (err) {
      failures.push(`${puzzle.name}: ${(err as Error).message}`);
    }
  }

  progress.finish({
    success: failures.length === 0,
    msg:
      `${pieces} pieces measured, ${fromCurated} centred by hand, ${edges} borders found` +
      (failures.length > 0 ? `, ${failures.length} problems` : ""),
    failures,
    counts: { pieces, fromCurated, edges, failed: failures.length },
  });
});

export default mapEditor;
