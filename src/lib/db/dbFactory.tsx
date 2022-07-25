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

function securizeQuery(sql: string): string {
  //disable sql injection
  sql = sql.replace(/[';]/g, "");
  //detect INSERT UPDATE DELETE DROP
  if (sql.toUpperCase().includes("INSERT") || sql.toUpperCase().includes("UPDATE") || sql.toUpperCase().includes("DELETE") || sql.toUpperCase().includes("DROP ")) {
    sql = "";
    throw new Error("SQL Injection detected");
  }
  return sql;
}

export default query;
