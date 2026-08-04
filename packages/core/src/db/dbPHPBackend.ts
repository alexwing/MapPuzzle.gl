import axios from 'axios';
import { QueryExecResult } from "sql.js";
import { ConfigService } from "../services/configService";
import { mapResultToQueryExecResult } from "./modelMappers";

export const query = async (sql: string): Promise<QueryExecResult[]> => {
  const response = await axios.post(ConfigService.backendUrl + "/", {
    query: sql,
  });
  const data = response.data;
  // The endpoint answers with rows on success and {error} on failure; anything
  // that is not an array would blow up the mapper.
  if (!Array.isArray(data)) {
    console.log(data?.error ?? data?.message ?? "Unexpected response");
    return [];
  }
  return mapResultToQueryExecResult(data);
};
