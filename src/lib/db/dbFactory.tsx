//create factory to conect a db
import { query as querySqlite } from "./dbSqlite";
import { query as queryBackend } from "./dbBackend";
import { ConfigService } from "../../services/configService";
import { QueryExecResult } from "sql.js";

export const dbFactory = {
  sqlite: querySqlite,
  backend: queryBackend,
};

//function to execute a query,
export async function query(sql: string): Promise<QueryExecResult[]> {
  if (ConfigService.backend) {
    return dbFactory.backend(sql);
  }
  return dbFactory.sqlite(sql);
}

export default query;
