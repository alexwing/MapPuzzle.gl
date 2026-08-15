import type { MapGeneratorModel } from "@mappuzzle/shared";
import express, { Request, Response } from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import { ShapefileImporter } from "../server/ShapefileImporter";
import path from "path";
import { TEMP_DIR, ensureDir, shapefilesDir } from "../config/paths";
import * as fs from "fs";

import AdmZip from "adm-zip";
import ViewState from "../models/viewState";

// eslint-disable-next-line new-cap
const mapCreator = express.Router();
// Route: <HOST>:PORT/api/mapCreator

//express enable upload files
express.json({ limit: "125mb" });
express.urlencoded({ limit: "125mb", extended: true });

//mapGenerator endpoint
mapCreator.post("/importShapefile", async (req: Request, res: Response) => {
  if (!req.files) return res.status(400).send("No files were uploaded.");

  try {
    const file = req.files.file;
    // @ts-expect-error express-fileupload types req.files as a union that is
    // not narrowed here; the guard above already ruled the other side out.
    const ext = req.files.file.name.split(".").pop();
    if (ext.toLowerCase() !== "zip" || file === undefined) {
      return res
        .status(400)
        .json({ success: false, msg: "Only .zip files are accepted" });
    }

    // Unpacked next to the other source data and kept: the generate step reads
    // it later, which is the role the imported PostGIS table used to play.
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
    ensureDir(TEMP_DIR);
    // @ts-expect-error same union: file is UploadedFile here, not an array.
    new AdmZip(file.data).extractAllTo(TEMP_DIR, true);

    // Shapefiles come as a set of sidecars, and some archives nest them in a
    // folder, so every piece is collected wherever it sits.
    const wanted = [".shp", ".dbf", ".shx", ".prj", ".cpg"];
    const collected: string[] = [];
    const collect = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collect(full);
        } else if (wanted.includes(path.extname(entry.name).toLowerCase())) {
          ensureDir(shapefilesDir());
          fs.copyFileSync(full, path.join(shapefilesDir(), entry.name));
          if (entry.name.toLowerCase().endsWith(".shp")) {
            collected.push(entry.name.slice(0, -4));
          }
        }
      }
    };
    collect(TEMP_DIR);
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    if (collected.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "No .shp file found in the zip" });
    }
    res.json({
      success: true,
      msg: `Imported ${collected.length} layer(s): ${collected.join(", ")}`,
      data: collected,
    });
  } catch (e) {
    unavailable(res, "importShapefile", e);
  }
});

/**
 * Answers with the reason instead of letting the rejection escape.
 *
 * Express 4 does not catch errors thrown from an async handler, so anything
 * thrown in here used to become an unhandled rejection and kill the process.
 */
function unavailable(res: Response, action: string, e: unknown): void {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`${action} failed: ${message}`);
  res.status(400).json({ success: false, msg: message, data: null });
}

//gettables endpoint
// @ts-expect-error the handler answers with res.json in some branches and
// returns the response object in others, which the Router overload rejects.
mapCreator.get("/getTables", async (req: Request, res: Response) => {
  try {
    const data = new ShapefileImporter().listLayers();
    res.json({ success: true, msg: "Layers retrieved successfully", data });
  } catch (e) {
    unavailable(res, "getTables", e);
  }
});

//get all columns from table
mapCreator.post("/getColumns", async (req: Request, res: Response) => {
  try {
    const preview = await new ShapefileImporter().describeLayer(req.body.table);
    res.json({
      success: true,
      msg: `${preview.count} features, ${preview.fields.length} fields`,
      ...preview,
    });
  } catch (e) {
    unavailable(res, "getColumns", e);
  }
});

//generate geojson in public map folder
mapCreator.post("/generateJson", async (req: Request, res: Response) => {
  try {
  const mapGenerator = new ShapefileImporter();
  const mapGeneratorData = req.body as MapGeneratorModel;
  const mapGeneratorResult = await mapGenerator
    .generateJson(mapGeneratorData)
    .then((result) => {
      //get puzzle sqlite table from json data data\[fileJson].geojson
      const viewState = result;
      const jsonName = "maps/" + mapGeneratorData.fileJson + ".geojson";
      const puzzleRepository = connection!.getRepository(Puzzles);
      puzzleRepository
        .findOne({ where: { data: jsonName } })
        .then((puzzleSaved) => {
          //get last puzzle id +1
          puzzleRepository
            .find({ order: { id: "DESC" }, take: 1 })
            .then((puzzleLast) => {
              const puzzle = new Puzzles();
              // The title as typed, falling back to un-slugifying the file name
              // for older callers that do not send one.
              puzzle.name =
                mapGeneratorData.title?.trim() ||
                mapGeneratorData.fileJson
                  .replace(/_/g, " ")
                  .replace(/\w\S*/g, (w) =>
                    w.replace(/^\w/, (c) => c.toUpperCase())
                  );
              puzzle.data = jsonName;
              puzzle.url = mapGeneratorData.fileJson;
              if (!puzzleSaved) {
                if (puzzleLast.length > 0) {
                  puzzle.id = puzzleLast[0].id + 1;
                } else {
                  puzzle.id = 1;
                }
              } else {
                puzzle.id = puzzleSaved.id;
              }
              puzzle.enableWiki = true;
              puzzle.enableFlags = false;
              puzzle.countryCode = 1;
              puzzle.comment = "http://www.diva-gis.org/datadown";
              //if first separated _ mapGeneratorData.fileJson and capitalize first letter
              if (mapGeneratorData.fileJson.split("_").length > 1) {
                puzzle.wiki = mapGeneratorData.fileJson
                  .split("_")[0]
                  .replace(/^\w/, (c) => c.toUpperCase());
              } else {
                puzzle.wiki = mapGeneratorData.fileJson;
              }
              puzzle.icon = "flags/_unknown.png";
              puzzleRepository.save(puzzle).then((puzzle) => {
                //get puzzle
                console.log("Puzzle saved successfully");
                const viewStateRepository =
                  connection!.getRepository(ViewState);
                viewState.id = puzzle.id;
                viewStateRepository.save(viewState).then(() => {
                  console.log("ViewState saved successfully");
                });
              });
            });
        });
      return result;
    });
  res.json({
    success: true,
    msg: "Json generated successfully",
    data: mapGeneratorResult,
  });
  } catch (e) {
    unavailable(res, "generateJson", e);
  }
});

export default mapCreator;
