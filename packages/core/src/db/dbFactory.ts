//create factory to conect a db
import { query as queryBackend } from "./dbBackend";
import { query as queryPHPBackend } from "./dbPHPBackend";
import { ConfigService } from "../services/configService";
import type { QueryExecResult } from "@mappuzzle/shared";
import { securizeQuery } from "./securize";
import { QueryClient } from "react-query";

/*
 * Where the data comes from.
 *
 * There used to be a third way in: sql.js-httpvfs pulling 4 KB pages of the
 * SQLite file straight into the browser over range requests. It was how the
 * game worked before there was a backend of any kind, and it cost three
 * dependencies, a web worker and a WebAssembly build shipped to every visitor.
 * The PHP gateway does the same job on the server, in a few kilobytes of PHP,
 * so that mode is gone.
 */
export const dbFactory = {
  backend: queryBackend,
  php: queryPHPBackend,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ConfigService.staleTime,
    },
  },
});

//function to execute a query,
async function queryAxios(sql: string): Promise<QueryExecResult[]> {
  //securize query
  try {
    sql = securizeQuery(sql);
    switch (ConfigService.backend) {
      case "backend":
        //backend node.js mode
        return await dbFactory.backend(sql);
      default:
        //php gateway, which is what production serves
        return await dbFactory.php(sql);
    }
  } catch (err) {
    console.log(err);
    return [];
  }
}

export async function query(sql: string): Promise<QueryExecResult[]> {
  return queryClient.fetchQuery(sql, () => queryAxios(sql));
}
