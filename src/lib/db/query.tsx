import { QueryExecResult, SqlValue } from "sql.js";
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
async function dbConect(): Promise<WorkerHttpvfs> {
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = await createDbWorker([config], workerUrl, wasmUrl);
  return workerInstance;
}

//function to execute a query, return a Promise with the result
export async function query(sql: string): Promise<QueryExecResult[]> {
  if (ConfigService.backend) {
    return queryBackend(sql);
  }
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

export async function queryBackend(sql: string): Promise<QueryExecResult[]> {
  //get query from post data to execute in sqlite and return json object
  const response = await fetch(ConfigService.backendUrl + "query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: sql,
    }),
  });
  const data = await response.json();
  if (data.errno) {
    console.log(data.message);
    return [];
  }
  return mapResultToQueryExecResult(data);
}

//map the result data to a QueryExecResult[]
function mapResultToQueryExecResult(data: any[]): QueryExecResult[] {
  let queryExecResults: QueryExecResult[] = [];
  let columns: string[] = [];
  let values: SqlValue[][] = [];
  let first: boolean = true;
  data.forEach((element) => {
    let value: SqlValue[] = [];
    for (let prop in element) {
      if (element.hasOwnProperty(prop)) {
        value.push(element[prop] as SqlValue);
      }
    }
    values.push(value);
    if (first) {
      columns = Object.keys(data[0]);
      first = false;
    }
  });

  queryExecResults.push({
    columns: columns,
    values: values,
  } as QueryExecResult);

  return queryExecResults;
}
