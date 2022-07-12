import { query } from "../lib/db/query";
import { QueryExecResult, SqlValue } from "sql.js";
import { Puzzle } from "../models/puzzleModel";
import { promises } from "stream";

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
  public static getPuzzle(id: number): Promise<Puzzle | null> {
    return query(
      `SELECT p.*, vs.latitude, vs.longitude, vs.zoom  FROM puzzles p INNER JOIN view_state vs ON p.id = vs.id WHERE p.id = ${id}`
    )
      .then((result: QueryExecResult[]) => {
        if (result.length > 0) {
          return PuzzleService.mapResultToPuzzle(result[0].values[0]);
        }
        return Promise.resolve(null);
      })
      .catch((err) => {
        console.log(err);
        return Promise.resolve(null);
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
}
