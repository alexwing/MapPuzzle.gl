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
import { customFlagsDir, ensureDir, flagsDir, sitemapPaths } from "../config/paths";

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
    fs.writeFileSync(sourcePath, sourceBuffer);

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

  let sitemap = await streamToPromise(Readable.from(links).pipe(stream)).then(
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

export default mapEditor;
