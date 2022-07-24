import { QueryExecResult } from "sql.js";
import { createDbWorker, WorkerHttpvfs } from "sql.js-httpvfs";
import { SplitFileConfig } from "sql.js-httpvfs/dist/sqlite.worker";
import { ConfigService } from "../../services/configService";

const workerUrl: string = "sqlite.worker.js";
const wasmUrl: string = "sql-wasm.wasm";

// the config is either the url to the create_db script, or a inline configuration:
const config: SplitFileConfig = {
  from: "inline",
  config: {
    serverMode: "full", // file is just a plain old full sqlite database
    requestChunkSize: 4096, // the page size of the  sqlite database (by default 4096)
    url: "puzzles.sqlite3.png", // url to the database (relative or full)
  },
};

let workerInstance: WorkerHttpvfs;

// worker.db is a now SQL.js instance except that all functions return Promises.
async function createDB(): Promise<WorkerHttpvfs> {
  if (workerInstance) {
    return workerInstance;
  }
  return createDbWorker([config], workerUrl, wasmUrl);
}

//function to execute a query, return a Promise with the result
export function query(sql: string): Promise<QueryExecResult[]> {
  if (ConfigService.foo === "mappuzzle-dev") {
    return queryBackend(sql);
  }
  //create worker
  return createDB()
    .then((worker: WorkerHttpvfs) => {
      //query
      workerInstance = worker;
      return worker.db.exec(sql);
    })
    .catch((err) => {
      console.log(err);
      return [];
    });
}


export async function queryBackend(sql: string): Promise<QueryExecResult[]> {
  //get query from post data to execute in sqlite and return json object
  const response = await fetch(ConfigService.backendUrl+"query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql: sql,
    }),
  });
  return response.json();
}
    


