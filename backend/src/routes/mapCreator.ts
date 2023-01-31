import { MapGeneratorModel } from "../../../src/models/Interfaces";
import express from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import { MapGenerator } from "../server/MapGenerator";
import path from "path";
import * as fs from "fs";

import AdmZip from "adm-zip";
import ViewState from "../models/viewState";

// eslint-disable-next-line new-cap
const mapCreator = express.Router();
// Route: <HOST>:PORT/api/users/

//express enable upload files

express.json({ limit: "125mb" });
express.urlencoded({ limit: "125mb", extended: true });


//mapGenerator endpoint
mapCreator.post("/importShapefile", async (req, res) => {
  /* from     const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      */

  if (!req.files) return res.status(400).send("No files were uploaded.");

  const file = req.files.file;
  //const name = req.body.name;
  // @ts-ignore
  const ext = req.files.file.name.split(".").pop();

  //if zip file
  if (ext.toLowerCase() === "zip" && file !== undefined) {
    //unzip file in temp folder
    // @ts-ignore
    const zip = new AdmZip(file.data);
    //const zipEntries = zip.getEntries();
    const tempDir = path.join(__dirname, `../../../temp`);
    //delete temp folder if exists
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir, { recursive: true });
    }
    //create temp folder
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    zip.extractAllTo(tempDir, true);
    //get all files in temp folder
    const files = fs.readdirSync(tempDir);
    //for each file
    for (const file of files) {
      //get file extension
      const ext = file.split(".").pop();
      const nameTable = file.split(".").shift();
      //if file is a shapefile
      // @ts-ignore
      if (ext.toLowerCase() === "shp") {
        //import shapefile
        const mapGenerator = new MapGenerator();
        const mapGeneratorResult = await mapGenerator
          .importShapefile(
            path.join(tempDir, file),
            // @ts-ignore
            nameTable
          )
          .then((result) => {
            return result;
          });
        console.log("mapGeneratorResult", mapGeneratorResult);
      }
    }
    res.json({
      success: true,
      msg: "Shapefile imported successfully",
    });
  }
});

//gettables endpoint
// @ts-ignore
mapCreator.get("/getTables", async (req, res) => {
  const mapGenerator = new MapGenerator();
  const mapGeneratorResult = await mapGenerator.getTables().then((result) => {
    return result;
  });
  console.log("mapGeneratorResult", mapGeneratorResult);
  res.json({
    success: true,
    msg: "Tables retrieved successfully",
    data: mapGeneratorResult,
  });
});

//get all columns from table
mapCreator.post("/getColumns", async (req, res) => {
  const mapGenerator = new MapGenerator();
  const mapGeneratorResult = await mapGenerator
    .getColumns(req.body.table)
    .then((result) => {
      return result;
    });
  console.log("mapGeneratorResult", mapGeneratorResult);
  res.json({
    success: true,
    msg: "Columns retrieved successfully",
    data: mapGeneratorResult,
  });
});

//generate geojson in public map folder
mapCreator.post("/generateJson", async (req, res) => {
  const mapGenerator = new MapGenerator();
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
              //replace _ by space, and capitalize words
              puzzle.name = mapGeneratorData.fileJson
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
              puzzle.wiki = mapGeneratorData.fileJson;
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
  console.log("mapGeneratorResult", mapGeneratorResult);
  res.json({
    success: true,
    msg: "Json generated successfully",
    data: mapGeneratorResult,
  });
});

export default mapCreator;
