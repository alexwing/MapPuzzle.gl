import { QueryExecResult, SqlValue } from "sql.js";
import { ConfigService } from "../../services/configService";

//function to execute a query, return a Promise with the result
export async function query(sql: string): Promise<QueryExecResult[]> {
    //get query from post data to execute in sqlite and return json object
  const response = await fetch(ConfigService.backendUrl + "/query", {
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
