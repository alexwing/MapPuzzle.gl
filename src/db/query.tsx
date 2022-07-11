import { QueryExecResult } from "sql.js";
import { createDbWorker, WorkerHttpvfs } from "sql.js-httpvfs";
import { SplitFileConfig } from "sql.js-httpvfs/dist/sqlite.worker";

const workerUrl:string = "sqlite.worker.js";
const wasmUrl:string = "sql-wasm.wasm";

// the config is either the url to the create_db script, or a inline configuration:
const config: SplitFileConfig = {
  from: "inline",
  config: {
    serverMode: "full", // file is just a plain old full sqlite database
    requestChunkSize: 4096, // the page size of the  sqlite database (by default 4096)
    url: "db.sqlite", // url to the database (relative or full)
  },
};

// worker.db is a now SQL.js instance except that all functions return Promises.
export async function createDB(): Promise<WorkerHttpvfs> {
  return createDbWorker([config], workerUrl, wasmUrl);
}

//function to execute a query, return a Promise with the result
export function query(sql: string) : Promise<QueryExecResult[]> {
  //create worker
  return createDB().then((worker:WorkerHttpvfs) => {
    //query
    return worker.db.exec(sql);
  });
}
