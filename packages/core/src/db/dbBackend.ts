import axios from 'axios';
import type { QueryExecResult } from "@mappuzzle/shared";
import { ConfigService } from "../services/configService";
import { mapResultToQueryExecResult } from "./modelMappers";

export const query = async (sql: string): Promise<QueryExecResult[]> => {
  const response = await axios.post(ConfigService.backendUrl + "/query", {
    query: sql,
  });
  const data = response.data;
  if (data.errno) {
    console.log(data.message);
    return [];
  }
  return mapResultToQueryExecResult(data);
};
