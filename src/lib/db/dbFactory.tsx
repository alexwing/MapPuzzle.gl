//create factory to conect a db
import { query as querySqlite } from "./dbSqlite";
import { query as queryBackend } from "./dbBackend";
import { ConfigService } from "../../services/configService";
import { QueryExecResult } from "sql.js";
import { securizeQuery } from "../Commons";

export const dbFactory = {
  sqlite: querySqlite,
  backend: queryBackend,
};

//function to execute a query,
export async function query(sql: string): Promise<QueryExecResult[]> {
  //securize query
  try {
    sql = securizeQuery(sql);
    if (ConfigService.backend) {
      return dbFactory.backend(sql);
    }
    return dbFactory.sqlite(sql);
  }
  catch (err) {
    console.log(err);
    return [];
  }
}



export default query;
