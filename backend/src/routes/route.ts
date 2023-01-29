import { PieceProps, MapGeneratorModel } from "../../../src/models/Interfaces";
import express from "express";
import Puzzles from "../models/puzzles";
import { connection } from "../server/database";
import { MapGenerator } from "../server/MapGenerator";
import CustomWiki from "../models/customWiki";
import CustomCentroids from "../models/customCentroids";
import CustomTranslations from "../models/customTranslations";
import Languages from "../models/languages";
import { securizeQuery } from "../../../src/lib/Commons";
import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import fetch from "node-fetch";
import path from "path";
import * as fs from "fs";
import svg2png from "svg2png";
import sharp from "sharp";
import AdmZip from "adm-zip";
import ViewState from "../models/viewState";

// eslint-disable-next-line new-cap
const router = express.Router();
// Route: <HOST>:PORT/api/users/

//express enable upload files

express.json({ limit: "125mb" });
express.urlencoded({ limit: "125mb", extended: true });

//return in get response custom query from the database
router.get("/query", (req, res) => {
  const { query } = req.query;
  console.log("query:" + JSON.stringify(query));
  if (query) {
    const sql: string = securizeQuery(query.toString());
    connection!
      .query(sql)
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json({ success: false, msg: "No query provided" });
  }
});
//return in post response custom query from the database
router.post("/query", (req, res) => {
  const { query } = req.body;
  console.log("query:" + JSON.stringify(query));
  if (query) {
    connection!
      .query(query.toString())
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json({ success: false, msg: "No query provided" });
  }
});

// Used for tests (nothing functional)
router.get("/testme", (_req, res) => {
  res.status(200).json({ success: true, msg: "all good" });
});

router.post("/savePuzzle", (req, res) => {
  const { puzzle } = req.body;
  console.log("puzzle:" + JSON.stringify(puzzle));
  const puzzleRepository = connection!.getRepository(Puzzles);
  puzzleRepository
    .save(puzzle)
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

router.post("/savePiece", async (req, res) => {
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

router.get("/generateSitemap", async (_req, res) => {
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

router.post("/generateTranslation", async (req, res) => {
  const generateTranslation = req.body;
  const langErrors: CustomTranslations[] = [];
  if (generateTranslation) {
    const languages: Languages[] = generateTranslation.languages as Languages[];
    const languagesRepository = connection!.getRepository(Languages);
    if (languages.length > 0) {
      for await (const language of languages) {
        console.log("Lang:" + JSON.stringify(language));
        await languagesRepository
          .save(language)
          .then(() => {
            console.log("Lang saved: " + JSON.stringify(language));
          })
          .catch((err: any) => {
            console.error("Error saving custom translation: " + err.message);
          });
      }
    }

    //get all languages actives
    const activeLangs = await languagesRepository.find({
      where: {
        active: 1,
      },
    });

    const translations: CustomTranslations[] =
      generateTranslation.translations as CustomTranslations[];

    if (translations.length > 0) {
      const customTranslationsRepository =
        connection!.getRepository(CustomTranslations);
      let first: boolean = true;
      for await (const translation of translations) {
        if (first) {
          first = false;
          //delete al translations for this puzzle id
          await customTranslationsRepository
            .delete({
              id: translation.id,
            })
            .then(() => {
              console.log(
                "Custom translations deleted successfully for puzzle : " +
                  translation.id
              );
            });
        }
        //if translation lang is active
        if (translation.lang === "Error") {
          console.error("Error: " + JSON.stringify(translation));
          langErrors.push(translation);
        }
        if (activeLangs.find((lang) => lang.lang === translation.lang)) {
          await customTranslationsRepository
            .save(translation)
            .then(() => {
              console.log("Translation saved: " + JSON.stringify(translation));
            })
            .catch((err: any) => {
              console.error("Error saving custom translation: " + err.message);
            });
        }
      }
    }
  }
  res.json({
    success: true,
    msg: "Generate Translation languages saved successfully",
    langErrors: langErrors,
  });
});

router.post("/generateFlags", async (req, res) => {
  const generateFlags = req.body;
  if (generateFlags) {
    const pieces: PieceProps[] = generateFlags.pieces as PieceProps[];
    const id: number = generateFlags.id as number;

    let success = true;
    let error: any;
    for (const piece of pieces) {
      try {
        let pieceId = piece.name;
        if (piece.customWiki && piece.customWiki.wiki !== "") {
          pieceId = piece.customWiki.wiki;
        }

        const filePathPiece = path.join(
          __dirname,
          `../../../public/customFlags/${id}/${piece.properties.cartodb_id}`
        );
        //if not exist as PNG or SVG
        if (
          !fs.existsSync(filePathPiece + ".png") &&
          !fs.existsSync(filePathPiece + ".svg") &&
          !fs.existsSync(filePathPiece + ".jpg")
        ) {
          if (piece) {
            const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&generator=images&gimlimit=50&prop=imageinfo&iiprop=url&format=json&titles=${pieceId}`;
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
            try {
              const json = (await response.json()) as any;

              if (json) {
                const { pages } = json.query;
                let urlFlagImage = "";
                if (pages) {
                  for (const page in pages) {
                    try {
                      if (pages[page].imageinfo) {
                        // @ts-ignore
                        const url = decodeURI(pages[page].imageinfo[0].url)
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toString()
                          .toLowerCase();
                        try {
                          //const exclude = [""];
                          const formats = ["png", "svg"];
                          const firstWordPiece = pieceId
                            .split("_")
                            .shift()
                            ?.toLocaleLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "");
                          console.log(
                            "url:" + url,
                            "firstWordPiece:" + firstWordPiece
                          );
                          /*const lastWordPiece = pieceId
                            .split("_")
                            .pop()
                            ?.toLocaleLowerCase();*/
                          // @ts-ignore
                          if (
                            (url.includes("flag") ||
                              url.includes(
                                "bandera"
                              )) /*url.includes(lastWordPiece) ||*/ &&
                            // @ts-ignore
                            url.includes(firstWordPiece) &&
                            formats.includes(url.split(".").pop()!)
                            // @ts-ignore
                            // && !url.includes(exclude)
                          ) {
                            urlFlagImage = pages[page].imageinfo[0].url;
                            break;
                          }
                        } catch (err: any) {
                          if (url.includes("flag")) {
                            urlFlagImage = pages[page].imageinfo[0].url;
                            break;
                          }
                        }
                      }
                    } catch (err: any) {
                      console.error("Error parsing imageinfo: " + err.message);
                    }
                  }
                }
                if (urlFlagImage !== "") {
                  console.log(
                    "urlFlagImage:",
                    urlFlagImage + " pieceId: " + pieceId
                  );
                  //save flag image to file
                  //get file extension
                  const ext = urlFlagImage.split(".").pop();
                  const fileName = `${piece.properties.cartodb_id}.${ext}`;
                  const filePath = path.join(
                    __dirname,
                    `../../../public/customFlags/${id}/${fileName}`
                  );
                  console.log("filePath:", filePath);

                  //if filePath not exists
                  if (!fs.existsSync(filePath)) {
                    const response = await fetch(urlFlagImage, {
                      headers: {
                        "User-Agent":
                          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
                      },
                    });
                    //create subfolder if not exists
                    const dir = path.join(
                      __dirname,
                      `../../../public/customFlags/${id}`
                    );
                    if (!fs.existsSync(dir)) {
                      fs.mkdirSync(dir);
                    }
                    const writer = fs.createWriteStream(filePath);
                    response.body.pipe(writer);
                    await new Promise((resolve, reject) => {
                      writer.on("finish", resolve);
                      writer.on("error", reject);
                    });
                    //set time to wait for file to be saved
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                  } else {
                    console.log(
                      "File already exists in path: " +
                        filePath +
                        " Piece: " +
                        piece.name
                    );
                  }
                } else {
                  console.log(
                    "No original image found for piece: " + piece.name
                  );
                }
              }
            } catch (err: any) {
              console.error("Error parsing json: " + err.message);
            }
          }
        }
      } catch (e) {
        success = false;
        error = e;
      }
    }

    if (success) {
      res.json({
        success: true,
        msg: "Generate Flags saved successfully",
      });
    } else {
      res.json({
        success: false,
        msg: "Error saving flags",
        error: error,
      });
    }
    console.log("Success:", success);
    console.log("Error:", error);
  }
});

router.post("/generateThumbs", async (req, res) => {
  const generateFlags = req.body;
  if (generateFlags) {
    const id: number = generateFlags.id as number;

    let success = true;
    let error: any;
    try {
      //create subfolder if not exists
      const dir = path.join(__dirname, `../../../public/customFlags/${id}`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      //if dir exists
      if (fs.existsSync(dir)) {
        //get all files in dir
        const files = fs.readdirSync(dir);
        //for each file
        for (const file of files) {
          //get file extension
          const ext = file.split(".").pop();
          const extOut = "png";
          const fileOut = ext ? file.replace(ext, extOut) : file;
          const sizes = [64, 128, 256, 512, 1024];
          //const sizes = [64];
          //if file size 64 not exists
          if (!fs.existsSync(path.join(dir, `${sizes[0]}`, fileOut))) {
            //if file is not a png
            let pngBuffer: Buffer = Buffer.alloc(0);
            switch (ext) {
              case "svg":
                //read file
                const svgBuffer = fs.readFileSync(path.join(dir, file));
                //convert to PNG
                try {
                  pngBuffer = await svg2png(svgBuffer);
                } catch (e) {
                  console.log("Error converting svg to png:", e);
                }
                break;
              case "png":
                //read file
                pngBuffer = fs.readFileSync(path.join(dir, file));
                break;
            }
            if (pngBuffer && pngBuffer.length > 0) {
              //for each width
              for (const size of sizes) {
                //resize image
                //if dir size exists
                const sizeDir = path.join(dir, `${size}`);
                if (!fs.existsSync(sizeDir)) {
                  fs.mkdirSync(sizeDir);
                }
                const pngFilePath = path.join(sizeDir, fileOut);

                //save image
                await sharp(pngBuffer)
                  .resize({
                    height: size,
                    withoutEnlargement: true,
                  })
                  .toFile(pngFilePath);
              }
              console.log("Thumbs saved successfully for file: " + file);
            }
          } else {
            console.log("File already exists in path: " + fileOut);
          }
        }
      } else {
        success = false;
        error = "Folder not found";
      }
    } catch (e) {
      success = false;
      error = e;
    }

    if (success) {
      res.json({
        success: true,
        msg: "Generate Thumbs saved successfully",
      });
    } else {
      res.json({
        success: false,
        msg: "Error saving thumbs",
        error: error,
      });
    }
    console.log("Success:", success);
    console.log("Error:", error);
  }
});

//mapGenerator endpoint
router.post("/importShapefile", async (req, res) => {
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
router.get("/getTables", async (req, res) => {
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
router.post("/getColumns", async (req, res) => {
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
router.post("/generateJson", async (req, res) => {
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

export default router;
