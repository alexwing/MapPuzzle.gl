import { QueryExecResult } from "sql.js";
import { createDbWorker, WorkerHttpvfs } from "sql.js-httpvfs";
import { SplitFileConfig } from "sql.js-httpvfs/dist/sqlite.worker";
import { ConfigService } from "../../services/configService";

const workerUrl = "sqlite.worker.js";
const wasmUrl = "sql-wasm.wasm";

// the config is either the url to the create_db script, or a inline configuration:
const config: SplitFileConfig = {
  from: "inline",
  config: {
    serverMode: "full", // file is just a plain old full sqlite database
    requestChunkSize: 4096, // the page size of the  sqlite database (by default 4096)
    url: ConfigService.database, // url to the database (relative or full)
  },
};

let workerInstance: WorkerHttpvfs;

// worker.db is a now SQL.js instance except that all functions return Promises.
async function dbConect(): Promise<WorkerHttpvfs> {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = await createDbWorker([config], workerUrl, wasmUrl);
  return workerInstance;
}

//function to execute a query, return a Promise with the result
export async function query(sql: string): Promise<QueryExecResult[]> {

  try {
    //create worker
    const worker = await dbConect();
    //execute query
    return await worker.db.exec(sql);
  } catch (err) {
    console.log(err);
    return [];
  }
}
