import { query } from "../lib/db/dbFactory";
import { QueryExecResult, SqlValue } from "sql.js";
import { ConfigService } from "./configService";
import Puzzles from "../../backend/src/models/puzzles";
import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import { PieceProps } from "../models/Interfaces";

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
            puzzles.push(PuzzleService.mapResultToPuzzle(value));
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
          return PuzzleService.mapResultToPuzzle(result[0].values[0]);
        }
        return Promise.reject("Puzzles not found");
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject("Puzzles not found");
      });
  }

  //map the result to a Puzzles object
  public static mapResultToPuzzle(result: SqlValue[]): Puzzles {
    return {
      id: result[0],
      comment: result[1],
      data: result[2],
      icon: result[3],
      name: result[4],
      url: result[5],
      wiki: result[6],
      view_state: {
        latitude: result[7],
        longitude: result[8],
        zoom: result[9],
      },
    } as Puzzles;
  }

  //get custom centroids by puzzle id
  public static getCustomCentroids(id: number): Promise<CustomCentroids[]> {
    return query(`SELECT * FROM custom_centroids WHERE id = ${id}`)
      .then((result: QueryExecResult[]) => {
        let centroids: CustomCentroids[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            centroids.push(PuzzleService.mapResultToCustomCentroids(value));
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
      left: 0,
      top: 0,
    };
    try {
      const result = await query(
        `SELECT * FROM custom_centroids WHERE id = ${id} AND cartodb_id = ${cartodb_id}`
      );
      if (result.length > 0) {
        result.forEach((row) => {
          row.values.forEach((value) => {
            customCentroid = PuzzleService.mapResultToCustomCentroids(value);
          });
        });
      }
      return customCentroid;
    } catch (err) {
      console.log(err);
      return customCentroid;
    }
  }

  //map the result to a CustomCentroids object
  public static mapResultToCustomCentroids(
    result: SqlValue[]
  ): CustomCentroids {
    return {
      id: result[0],
      cartodb_id: result[1],
      left: result[2],
      top: result[3],
    } as CustomCentroids;
  }
  //get custom wikis by puzzle id
  public static async getCustomWikis(id: number): Promise<CustomWiki[]> {
    try {
      const result = await query(`SELECT * FROM custom_wiki WHERE id = ${id}`);
      let wikis: CustomWiki[] = [];
      result.forEach((row) => {
        row.values.forEach((value) => {
          wikis.push(PuzzleService.mapResultToCustomWiki(value));
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
            customWiki = PuzzleService.mapResultToCustomWiki(value);
          });
        });
      }
      return customWiki;
    } catch (err) {
      console.log(err);
      return customWiki;
    }
  }

  //map the result to a CustomWiki object
  public static mapResultToCustomWiki(result: SqlValue[]): CustomWiki {
    return {
      id: result[0],
      cartodb_id: result[1],
      wiki: result[2],
    } as CustomWiki;
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
}
