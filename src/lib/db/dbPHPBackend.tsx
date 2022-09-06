import { QueryExecResult } from "sql.js";
import { ConfigService } from "../../services/configService";
import { mapResultToQueryExecResult } from "../mappings/modelMappers";

//function to execute a query, return a Promise with the result
export async function query(sql: string): Promise<QueryExecResult[]> {
    //get query from post data to execute in sqlite and return json object
  const response = await fetch(ConfigService.backendUrl + "/", {
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

