import { query } from "../lib/db/query";
import { QueryExecResult, SqlValue } from "sql.js";
import { Puzzle } from "../models/puzzleModel";

export class PuzzleService {
  public static async getPuzzles(): Promise<Puzzle[]> {
    return query("SELECT * FROM puzzles")
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
              return [];
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
    } as Puzzle;
  }

  public static getPuzzle(id: number): Promise<any> {
    return query(`SELECT * FROM puzzles WHERE id = ${id}`)
      .then((result: QueryExecResult[]) => {
        console.log(result[0]);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
function getPuzzle(id: any, number: any): any {
  throw new Error("Function not implemented.");
}
