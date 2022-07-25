import { query } from "../lib/db/dbFactory";
import { QueryExecResult, SqlValue } from "sql.js";
import { CustomCentroids, CustomWiki, Puzzle } from "../models/PuzzleDb";
import { ConfigService } from "./configService";
//import Puzzles from "../../backend/src/models/puzzles";

export class PuzzleService {
  //get all puzzles
  public static async getPuzzles(): Promise<Puzzle[]> {
    return query(
      "SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id ORDER BY p.id"
    )
      .then((result: QueryExecResult[]) => {
        let puzzles: Puzzle[] = [];
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
  public static getPuzzle(id: number): Promise<Puzzle> {
    return query(
      `SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id WHERE p.id = ${id}`
    )
      .then((result: QueryExecResult[]) => {
        if (result.length > 0) {
          return PuzzleService.mapResultToPuzzle(result[0].values[0]);
        }
        return Promise.reject("Puzzle not found");
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject("Puzzle not found");
      });
  }

  //map the result to a Puzzle object
  public static mapResultToPuzzle(result: SqlValue[]): Puzzle {
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
    } as Puzzle;
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
  //map the result to a CustomCentroids object
  public static mapResultToCustomCentroids(
    result: SqlValue[]
  ): CustomCentroids {
    return {
      id: result[0],
      cartodb_id: result[1],
      name: result[2],
      left: result[3],
      top: result[4],
    } as CustomCentroids;
  }
  //get custom wikis by puzzle id
  public static getCustomWikis(id: number): Promise<CustomWiki[]> {
    return query(`SELECT * FROM custom_wiki WHERE id = ${id}`)
      .then((result: QueryExecResult[]) => {
        let wikis: CustomWiki[] = [];
        result.forEach((row) => {
          row.values.forEach((value) => {
            wikis.push(PuzzleService.mapResultToCustomWiki(value));
          });
        });
        return wikis;
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve([]);
      });
  }
  //map the result to a CustomWiki object
  public static mapResultToCustomWiki(result: SqlValue[]): CustomWiki {
    return {
      id: result[0],
      cartodb_id: result[1],
      name: result[2],
      wiki: result[3],
    } as CustomWiki;
  }

  //save a puzzle
  public static async savePuzzle(puzzle: Puzzle): Promise<any> {
   // console.log("puzzle: ",JSON.stringify(puzzle));
    const response = await fetch(ConfigService.backendUrl+"/savePuzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({puzzle}),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error saving puzzle");
    });
    return response.json();
  }
}
