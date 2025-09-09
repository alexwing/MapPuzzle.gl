/* eslint-disable @typescript-eslint/no-explicit-any */
import { query } from "../lib/db/dbFactory";
import { QueryExecResult } from "sql.js";
import Puzzles from "../../backend/src/models/puzzles";
import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import Languages from "../../backend/src/models/languages";
import { PuzzleSearchResults, Regions } from "../models/Interfaces";
import {
  mapResultToCustomCentroids,
  mapResultToCustomTranslations,
  mapResultToCustomWiki,
  mapResultToLanguage,
  mapResultToPuzzle,
  mapResultToPuzzleSearchResults,
} from "../lib/mappings/modelMappers";
import { securizeTextParameter } from "../lib/Commons";
import CustomTranslations from "../../backend/src/models/customTranslations";
import { ConfigService } from "./configService";

export class PuzzleService {
  //get all puzzles
  public static async getPuzzles(): Promise<Puzzles[]> {
    return query(
      "SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id ORDER BY p.name"
    )
      .then((result: QueryExecResult[]) => {
        const puzzles: Puzzles[] = [];
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

  //get a puzzle by url
  public static getPuzzleIdByUrl(url: string): Promise<number> {
    return query(
      `SELECT p.id  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id WHERE p.url = '${url}'`
    )
      .then((result: QueryExecResult[]) => {
        let id = 1;
        result.forEach((row) => {
          row.values.forEach((value) => {
            id = parseInt(value[0] ? value[0].toString() : "1");
          });
        });
        return id;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve(0);
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
  //get a puzzle wiki by id
  public static getPuzzleWiki(id: number): Promise<string> {
    return query(`SELECT p.wiki FROM puzzles p WHERE p.id = ${id}`)
      .then((result: QueryExecResult[]) => {
        if (result.length > 0) {
          return result[0].values[0][0]
            ? result[0].values[0][0].toString()
            : "";
        }
        return Promise.reject("Puzzles not found");
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject("Puzzles not found");
      });
  }

  //get all puzzles with region and subregion
  public static async getPuzzlesWithRegion(): Promise<PuzzleSearchResults[]> {
    return query(
      `SELECT p.*, c.regioncode, c.region, c.subregioncode, c.subregion FROM puzzles p INNER JOIN countries c ON p.countrycode = c.countrycode ORDER BY p.name`
    )
      .then((result: QueryExecResult[]) => {
        const puzzles: PuzzleSearchResults[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            puzzles.push(mapResultToPuzzleSearchResults(value));
          });
        });
        return puzzles;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }

  //get a puzzles by filters (region, subregion)
  public static getPuzzlesByFilters(
    regioncode: number,
    subregioncode: number,
    searchName: string
  ): Promise<PuzzleSearchResults[]> {
    let where = "";
    if (regioncode !== 0) {
      where = ` and c.regioncode = '${regioncode}'`;
    }
    if (subregioncode !== 0) {
      where = ` and c.subregioncode = '${subregioncode}'`;
    }
    if (searchName !== "" && searchName.length > 2) {
      where = ` and p.name like '%${securizeTextParameter(searchName)}%'`;
    }
    return query(
      `SELECT p.*, c.regioncode, c.region, c.subregioncode, c.subregion FROM puzzles p INNER JOIN countries c ON p.countrycode = c.countrycode WHERE 1=1 ${where} ORDER BY p.name`
    )
      .then((result: QueryExecResult[]) => {
        const puzzles: PuzzleSearchResults[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            const puzzle: PuzzleSearchResults =
              mapResultToPuzzleSearchResults(value);
            puzzles.push(puzzle);
          });
        });
        return puzzles;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }

  //get regions and subregions
  public static getRegions(): Promise<Regions[]> {
    return query(
      `SELECT DISTINCT c.regioncode, c.region, c.subregioncode, c.subregion FROM countries c ORDER BY c.region, c.subregion`
    )
      .then((result: QueryExecResult[]) => {
        const regions: Regions[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            regions.push({
              regionCode: value[0],
              region: value[1],
              subregionCode: value[2],
              subregion: value[3],
            } as Regions);
          });
        });
        return regions;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }

  public static getLanguages(): Promise<Languages[]> {
    return query(`SELECT * FROM languages WHERE active = 1 ORDER BY langname`)
      .then((result: QueryExecResult[]) => {
        const languages: Languages[] = [];
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

  //get pieces translations in a language
  public static async getCustomTranslations(
    id: number,
    lang: string
  ): Promise<CustomTranslations[]> {
    try {
      const result = await query(
        `SELECT * FROM custom_translations WHERE id = ${id} AND lang in ('${lang}','${ConfigService.defaultLang}')`
      );
      const customTranslations: CustomTranslations[] = [];
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
  public static async getLangIsRtl(lang: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT rtl FROM languages WHERE lang = "${lang}"`
      );
      let rtl = false;
      result.forEach((row) => {
        row.values.forEach((value) => {
          rtl = value[0] === 1 ? true : false;
        });
      });
      return rtl;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  public static getLanguagesByPuzzle(id: number): Promise<Languages[]> {
    return query(
      `SELECT DISTINCT l.* from custom_translations ct INNER JOIN languages l ON l.lang = ct.lang WHERE ct.id = ${id} AND l.active = 1 ORDER BY l.langname`
    )
      .then((result: QueryExecResult[]) => {
        const languages: Languages[] = [];
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
        const centroids: CustomCentroids[] = [];
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
      const wikis: CustomWiki[] = [];
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

  //get resource from url, not server side, client side
  public static getResource(url: string): Promise<string> {
    return fetch(url)
      .then((response) => response.text())
      .then((text) => text);
  }
}
