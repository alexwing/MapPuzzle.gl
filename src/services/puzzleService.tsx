import { query } from "../lib/db/dbFactory";
import { QueryExecResult, SqlValue } from "sql.js";
import { ConfigService } from "./configService";
import Puzzles from "../../backend/src/models/puzzles";
import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import CustomTranslations from "../../backend/src/models/customTranslations";
import Languages from "../../backend/src/models/languages";
import { PieceProps, WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { getWikiInfo } from "./wikiService";
import { getWikiSimple } from "../lib/Utils";
import {
  mapResultToCustomCentroids,
  mapResultToCustomTranslations,
  mapResultToCustomWiki,
  mapResultToLanguage,
  mapResultToPuzzle,
} from "../lib/mappings/modelMappers";

export class PuzzleService {
  //get all puzzles
  public static async getPuzzles(): Promise<Puzzles[]> {
    return query(
      "SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id ORDER BY p.id"
    )
      .then((result: QueryExecResult[]) => {
        let puzzles: Puzzles[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            puzzles.push(mapResultToPuzzle(value));
          });
        });
        return puzzles;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }
  //get a puzzle by id
  public static getPuzzle(id: number): Promise<Puzzles> {
    return query(
      `SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id WHERE p.id = ${id}`
    )
      .then((result: QueryExecResult[]) => {
        if (result.length > 0) {
          return mapResultToPuzzle(result[0].values[0]);
        }
        return Promise.reject("Puzzles not found");
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject("Puzzles not found");
      });
  }

  public static getLanguages(): Promise<Languages[]> {
    return query(`SELECT * FROM languages WHERE active = 1 ORDER BY langname`)
      .then((result: QueryExecResult[]) => {
        let languages: Languages[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            languages.push(mapResultToLanguage(value));
          });
        });
        return languages;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }

  public static getLanguagesByPuzzle(id: number): Promise<Languages[]> {
    return query(
      `SELECT DISTINCT l.* from custom_translations ct INNER JOIN languages l ON l.lang = ct.lang WHERE ct.id = ${id} AND l.active = 1 ORDER BY l.langname`
    )
      .then((result: QueryExecResult[]) => {
        let languages: Languages[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            languages.push(mapResultToLanguage(value));
          });
        });
        return languages;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }

  //get custom centroids by puzzle id
  public static getCustomCentroids(id: number): Promise<CustomCentroids[]> {
    return query(`SELECT * FROM custom_centroids WHERE id = ${id}`)
      .then((result: QueryExecResult[]) => {
        let centroids: CustomCentroids[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            centroids.push(mapResultToCustomCentroids(value));
          });
        });
        return centroids;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }
  //get custom centroids by puzzle id and cartodb_id
  public static async getCustomCentroid(
    id: number,
    cartodb_id: number
  ): Promise<CustomCentroids> {
    let customCentroid: CustomCentroids = {
      id: id,
      cartodb_id: cartodb_id,
      left: -50,
      top: -50,
    };
    try {
      const result = await query(
        `SELECT * FROM custom_centroids WHERE id = ${id} AND cartodb_id = ${cartodb_id}`
      );
      if (result.length > 0) {
        result.forEach((row) => {
          row.values.forEach((value) => {
            customCentroid = mapResultToCustomCentroids(value);
          });
        });
      }
      return customCentroid;
    } catch (err) {
      console.log(err);
      return customCentroid;
    }
  }

  //get custom wikis by puzzle id
  public static async getCustomWikis(id: number): Promise<CustomWiki[]> {
    try {
      const result = await query(`SELECT * FROM custom_wiki WHERE id = ${id}`);
      let wikis: CustomWiki[] = [];
      result.forEach((row) => {
        row.values.forEach((value) => {
          wikis.push(mapResultToCustomWiki(value));
        });
      });
      return wikis;
    } catch (err) {
      console.log(err);
      return Promise.resolve([]);
    }
  }
  //get custom wiki by puzzle id and cartodb_id
  public static async getCustomWiki(
    id: number,
    cartodb_id: number
  ): Promise<CustomWiki> {
    let customWiki: CustomWiki = {
      id: id,
      cartodb_id: cartodb_id,
      wiki: "",
    };
    try {
      const result = await query(
        `SELECT * FROM custom_wiki WHERE id = ${id} AND cartodb_id = ${cartodb_id}`
      );

      if (result.length > 0) {
        result.forEach((row) => {
          row.values.forEach((value) => {
            customWiki = mapResultToCustomWiki(value);
          });
        });
      }
      return customWiki;
    } catch (err) {
      console.log(err);
      return customWiki;
    }
  }

  //update pieceProps with wiki info and centroids
  public static async updatePieceProps(piece: PieceProps): Promise<PieceProps> {
    const wikiInfo = await this.getCustomWiki(
      piece.id ? piece.id : -1,
      piece.properties.cartodb_id
    );
    if (wikiInfo) {
      piece.customWiki = wikiInfo;
    }
    const customCentroid = await this.getCustomCentroid(
      piece.id ? piece.id : -1,
      piece.properties.cartodb_id
    );
    if (customCentroid) {
      piece.customCentroid = customCentroid;
    }
    return piece;
  }

  //save a puzzle
  public static async savePuzzle(puzzle: Puzzles): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/savePuzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ puzzle }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error saving puzzle");
    });
    return response.json();
  }
  //save piece
  public static async savePiece(piece: PieceProps): Promise<any> {
    // remove geometry from piece, to not send it to the backend
    const pieceToSend = {
      id: piece.id,
      properties: {
        cartodb_id: piece.properties.cartodb_id,
        name: piece.name,
        box: piece.properties.box,
      },
      customWiki: piece.customWiki,
      customCentroid: piece.customCentroid,
    } as PieceProps;

    const response = await fetch(ConfigService.backendUrl + "/savePiece", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pieceToSend }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error saving piece");
    });
    return response.json();
  }
  //generate translation for a piece
  public static async generateTranslation(
    pieces: PieceProps[],
    id: number
  ): Promise<any> {
    let languages: Languages[] = [];
    let translations: CustomTranslations[] = [];

    for await (const piece of pieces) {
      piece.id = id;
      //get custom wiki info
      const wiki = getWikiSimple(
        piece.name,
        piece.customWiki ? piece.customWiki.wiki : ""
      );
      //get wikiService getWikiInfo
      await getWikiInfo(wiki)
        .then((wikiInfo: WikiInfoPiece) => {
          if (wikiInfo.langs.length > 0) {
            wikiInfo.langs.forEach((lang: WikiInfoLang) => {
              //if not exist in languages, add it
              if (!languages.some((l) => l.lang === lang.lang)) {
                languages.push({
                  lang: lang.lang,
                  langname: lang.langname,
                  autonym: lang.autonym,
                } as Languages);
              }
              if (piece.id) {
                translations.push({
                  id: piece.id,
                  cartodb_id: piece.properties.cartodb_id,
                  lang: lang.lang,
                  translation: lang.id,
                } as CustomTranslations);
              }
            });
          } else {
            if (!languages.some((l) => l.lang === "error")) {
              languages.push({
                lang: "error",
                langname: "Error",
                autonym: "Error",
              } as Languages);
            }
            translations.push({
              id: piece.id,
              cartodb_id: piece.properties.cartodb_id,
              lang: "Error",
              translation: piece.name,
            } as CustomTranslations);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    //await 5 seconds to wait for the translations to be generated
    //await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await fetch(
      ConfigService.backendUrl + "/generateTranslation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languages: languages,
          translations: translations,
        }),
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating translation");
    });
    return response.json();
  }

  //get pieces translations in a language
  public static async getCustomTranslations(
    id: number,
    lang: string
  ): Promise<CustomTranslations[]> {
    try {
      const result = await query(
        `SELECT * FROM custom_translations WHERE id = ${id} AND lang in ("'${lang}'","en")`
      );
      let customTranslations: CustomTranslations[] = [];
      result.forEach((row) => {
        row.values.forEach((value) => {
          customTranslations.push(mapResultToCustomTranslations(value));
        });
      });
      return customTranslations;
    } catch (err) {
      console.log(err);
      return Promise.resolve([]);
    }
  }

  public static  async getLangIsRtl(lang: string) {
    try {
      const result = await query(
        `SELECT rtl FROM languages WHERE lang = "${lang}"`);
      let rtl = false;
      result.forEach((row) => {
        row.values.forEach((value) => {
          rtl = value[0] ==1 ? true : false;
        });
      }
      );
      return rtl;
    } catch (err) {
      console.log(err);
      return false;
    }
  }


}
