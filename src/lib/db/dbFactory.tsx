//create factory to conect a db
import { query as querySqlite } from "./dbSqlite";
import { query as queryBackend } from "./dbBackend";
import { query as queryPHPBackend } from "./dbPHPBackend";
import { ConfigService } from "../../services/configService";
import { QueryExecResult } from "sql.js";
import { securizeQuery } from "../Commons";

export const dbFactory = {
  sqlite: querySqlite,
  backend: queryBackend,
  php: queryPHPBackend,
};

//function to execute a query,
export async function query(sql: string): Promise<QueryExecResult[]> {
  //securize query
  try {
    sql = securizeQuery(sql);
    switch (ConfigService.backend) {
      case "sqlite":
        console.log("[sqlite Mode]");
        return await dbFactory.sqlite(sql);
      case "backend":
        console.log("[backend node.js Mode]");
        return await dbFactory.backend(sql);
      case "php":
        console.log("[PHP Mode]");
        return await dbFactory.php(sql);
      default:
        console.log("[sqlite Mode]");
        return await dbFactory.sqlite(sql);
    }
  } catch (err) {
    console.log(err);
    return [];
  }
}

export default query;
