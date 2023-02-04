import { FlagsIcons, PieceProps } from "../../../src/models/Interfaces";
import express from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import CustomWiki from "../models/customWiki";
import CustomCentroids from "../models/customCentroids";
import Countries from "../models/countries";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import * as fs from "fs";
import ViewState from "../models/viewState";
import path from "path";

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
  console.log("piece:" + JSON.stringify(pieceToSend));
  const pieceProps: PieceProps = pieceToSend as PieceProps;

  saveCustomWiki(pieceProps).then(() => {
    res.json({
      success: true,
      msg: "Piece saved successfully",
    });
  });
  saveCustomCentroids(pieceProps).then(() => {
    res.json({
      success: true,
      msg: "Piece saved successfully",
    });
  });
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
  //find flags icons in public folder flags and compare filename with country alpha2
  const flagsPath = path.join(__dirname, `../../../public/flags`);
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
async function saveCustomWiki(pieceProps: PieceProps): Promise<any> {
  if (pieceProps.customWiki) {
    const customWikiRepository = connection!.getRepository(CustomWiki);
    if (pieceProps.customWiki.wiki !== "") {
      customWikiRepository
        .save(pieceProps.customWiki)
        .then(() => {
          console.log("Custom wiki saved successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error saving custom wiki");
          return Promise.reject(err);
        });
    } else {
      //delete custom centroid for this id and cartodb_id
      customWikiRepository
        .delete({
          cartodb_id: pieceProps.properties.cartodb_id,
          id: pieceProps.id,
        })
        .then(() => {
          console.log("Custom wiki deleted successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error wiki custom centroid");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}
async function saveCustomCentroids(pieceProps: PieceProps): Promise<any> {
  if (pieceProps.customCentroid) {
    const customCentroidRepository = connection!.getRepository(CustomCentroids);
    if (
      pieceProps.customCentroid.left !== 0 ||
      pieceProps.customCentroid.top !== 0
    ) {
      customCentroidRepository
        .save(pieceProps.customCentroid)
        .then(() => {
          console.log("Custom centroid saved successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error saving custom centroid");
          return Promise.reject(err);
        });
    } else {
      //delete custom centroid for this id and cartodb_id
      customCentroidRepository
        .delete({
          cartodb_id: pieceProps.properties.cartodb_id,
          id: pieceProps.id,
        })
        .then(() => {
          console.log("Custom centroid deleted successfully");
          return Promise.resolve();
        })
        .catch((err) => {
          console.log("Error deleting custom centroid");
          return Promise.reject(err);
        });
    }
  }
  return Promise.resolve();
}
mapEditor.get("/generateSitemap", async (_req, res) => {
  const pieces = await connection!.getRepository(Puzzles).find();
  //create links from pieces format  const links = [{ url: '/page-1/',  changefreq: 'daily', priority: 0.3  }]
  const links = pieces.map((piece) => {
    return {
      url: `http://mappuzzle.xyz/?map=${piece.url}`,
      changefreq: "monthly",
      priority: 0.8,
    };
  });
  const stream = new SitemapStream({ hostname: "http://mappuzzle.xyz" });

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

  //save to disk in ../public/sitemap.xml
  fs.writeFile("../public/sitemap.xml", sitemap, function (err: any) {
    if (err) return console.log(err);
    console.log("sitemap.xml written");
  });
});

export default mapEditor;
