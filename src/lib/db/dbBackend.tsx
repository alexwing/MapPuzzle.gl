import axios from 'axios';
import { QueryExecResult } from "sql.js";
import { ConfigService } from "../../services/configService";
import { mapResultToQueryExecResult } from "../mappings/modelMappers";

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
