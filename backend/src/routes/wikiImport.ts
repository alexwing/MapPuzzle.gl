import { PieceProps } from "../../../src/models/Interfaces";
import express from "express";
import { connection } from "../server/database";
import CustomTranslations from "../models/customTranslations";
import Languages from "../models/languages";
import fetch from "node-fetch";
import path from "path";
import * as fs from "fs";
import sharp from "sharp";
import CustomWiki from "../models/customWiki";
import { Repository } from "typeorm";
import axios from "axios";

// eslint-disable-next-line new-cap
const wikiImport = express.Router();
// Route: <HOST>:PORT/api/wikiImport

//express enable upload files
express.json({ limit: "125mb" });
express.urlencoded({ limit: "125mb", extended: true });

wikiImport.post("/generateTranslation", async (req, res) => {
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

/*
    1.- Se reciben datos en el servidor con la información necesaria para descargar la imagen de la bandera (el nombre de la pieza y su identificador, entre otros).
    2.- Se hace una llamada a la API de Wikipedia para buscar la imagen de la bandera correspondiente a la pieza dada.
    3.- Se verifica si la imagen ya existe en el sistema de archivos. Si ya existe, se salta a la siguiente pieza.
    4.- Si la imagen no existe, se filtran los resultados de la búsqueda en la API de Wikipedia para encontrar la URL de la imagen que se corresponde con la bandera que estamos buscando.
    5.- Una vez que se tiene la URL de la imagen, se guarda la imagen en el sistema de archivos en una carpeta específica para la bandera correspondiente.
*/
wikiImport.post("/generateFlags", async (req, res) => {
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
            try {
              const response = await axios.get(url, {
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              });

              const json = response.data;
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
                          const includes = ["flag", "bandera", "bandeira"];
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
                            includes.some((word) =>
                              url.includes(word)
                            ) /*url.includes(lastWordPiece) ||*/ &&
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

wikiImport.post("/generateThumbs", async (req, res) => {
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
        const sizes = [64, 128, 256, 512, 1024];
        //delete all files in dir
        /*for (const size of sizes) {
          const sizeDir = path.join(dir, `${size}`);
          if (fs.existsSync(sizeDir)) {
            try{
            fs.rmdirSync(sizeDir, { recursive: true });
            }catch(err){
              console.error(err);
            }
          }
        }*/

        for (const file of files) {
          //get file extension
          const ext = file.split(".").pop();
          const extOut = "png";
          const fileOut = ext ? file.replace(ext, extOut) : file;

          const pngBuffer: Buffer = fs.readFileSync(path.join(dir, file));
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
              /*if (fs.existsSync(pngFilePath)) {
                //delete  file path.join(dir, `${sizes[0]}`, fileOut)
                fs.rm(pngFilePath, (err) => {
                  if (err) {
                    console.error(err);
                  }
                });
              }*/
              //save image
              if (!fs.existsSync(pngFilePath)) {
                sharp(pngBuffer)
                  .resize({
                    height: size,
                    withoutEnlargement: false,
                  })
                  .toFile(pngFilePath, (err) => {
                    if (err) {
                      console.error(err);
                    }
                  });
              }
            }
            console.log(
              "Thumbs saved successfully for file: " +
                path.join(dir, `${sizes[0]}`, fileOut)
            );
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

wikiImport.post("/generateWikiLinks", async (req, res) => {
  const generateTranslation = req.body;

  const langErrors: CustomTranslations[] = [];
  if (generateTranslation) {
    const id: number = generateTranslation.id as number;
    const pieces: PieceProps[] = generateTranslation.pieces as PieceProps[];
    const subFix: string = generateTranslation.subFix as string;
    //get custom wiki repository
    const wikiRepository = connection!.getRepository(CustomWiki);
    //find all pieces by puzzle id
    const wikiPieces = await wikiRepository.find({
      where: { id: id },
    });
    //for each piece
    for (const piece of pieces) {
      //if piece not exist in wikiPieces
      if (
        !wikiPieces.find(
          (wikiPiece) => wikiPiece.cartodb_id === piece.properties.cartodb_id
        )
      ) {
        //new CustomWiki
        const wikiPiece = new CustomWiki();
        //set id
        wikiPiece.id = id;
        wikiPiece.cartodb_id = piece.properties.cartodb_id;
        wikiPiece.wiki = piece.properties.name.replace(/ /g, "_") + subFix;
        //wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        //wipedia get request for find wiki page
        //with axios
        const wikiResponse = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info&generator=allpages&inprop=url&gaplimit=5&gapfrom=${wikiPiece.wiki}`);
        //get json from response
        const wikiJson = wikiResponse.data;
        //get pages from json
        if (wikiJson.query) {
          const wikiPages = wikiJson.query.pages;
          //for each page
          for (const wikiPage of Object.values(wikiPages)) {
            //if page title is equal to wikiPiece.wiki separated by _
            if (wikiPage) {
              if (
                /// @ts-ignore
                wikiPage.title.replace(/ /g, "_") === wikiPiece.wiki ||
                /// @ts-ignore
                wikiPage.title.toLowerCase() === wikiPiece.wiki.toLowerCase()
              ) {
                //last value after / in fullurl
                // @ts-ignore
                wikiPiece.wiki = decodeURI(wikiPage.fullurl.split("/").pop());
                //save wikiPiece
                if (wikiPiece.wiki !== "" && wikiPiece.wiki !== undefined) {
                  await wikiRepository.save(wikiPiece);
                }
                break;
              }
            } else {
              const customTranslations = new CustomTranslations();
              customTranslations.id = wikiPiece.id;
              customTranslations.cartodb_id = wikiPiece.cartodb_id;
              customTranslations.translation = wikiPiece.wiki;
              customTranslations.lang = "en";
              langErrors.push(customTranslations);
            }
          }
        } else {
          const customTranslations = new CustomTranslations();
          customTranslations.id = id;
          customTranslations.cartodb_id = piece.properties.cartodb_id;
          customTranslations.translation = piece.properties.name + subFix;
          customTranslations.lang = "en";
          langErrors.push(customTranslations);
        }
      }
      await verifyRedirection(wikiRepository, id, piece, subFix, langErrors);
    }
    if (langErrors.length > 0) {
      res.json({
        success: false,
        msg: "Error saving translations",
        error: langErrors,
      });
    } else {
      res.json({
        success: true,
        msg: "Translations saved successfully",
      });
    }
  }
});

export default wikiImport;

async function verifyRedirection(
  wikiRepository: Repository<CustomWiki>,
  id: number,
  piece: PieceProps,
  subFix: string,
  langErrors: CustomTranslations[]
) {
  const wikiPieces = await wikiRepository.find({
    where: { id: id, cartodb_id: piece.properties.cartodb_id },
  });
  for (const wikiPiece of wikiPieces) {
    if (wikiPiece) {
      try {
        //with axios
        const wikiResponse = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&origin=*&gimlimit=50&format=json&redirects&prop=redirects&rdlimit=max&titles=${wikiPiece.wiki}`);
        const wikiJson = wikiResponse.data;
        if (wikiJson.query) {
          if (wikiJson.query.redirects) {
            const wikiRedirects = wikiJson.query.redirects;
            for (const wikiRedirect of Object.values(wikiRedirects)) {
              if (wikiRedirect) {
                // @ts-ignore
                console.log(
                  "wikiPiece.wiki: " +
                    // @ts-ignore
                    wikiPiece.wiki +
                    " wikiRedirect.to: " +
                    // @ts-ignore
                    wikiRedirect.to
                );
                // @ts-ignore
                wikiPiece.wiki = decodeURI(wikiRedirect.to.replace(/ /g, "_"));
                await wikiRepository.save(wikiPiece);
                break;
              }
            }
          }
        } else {
          const customTranslations = new CustomTranslations();
          customTranslations.id = id;
          customTranslations.cartodb_id = piece.properties.cartodb_id;
          customTranslations.translation = piece.properties.name + subFix;
          customTranslations.lang = "en";
          langErrors.push(customTranslations);
        }
      } catch (e) {
        console.log("Error piece: " + piece.properties.name);
        console.log(e);
      }
    }
  }
}
