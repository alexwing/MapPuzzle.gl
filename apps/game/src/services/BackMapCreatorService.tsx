/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "./configService";
import { MapGeneratorModel } from "../models/Interfaces";

export class BackMapCreatorService {
  //import shapefile to postgis
  public static async importShapefile(file: File, name: string): Promise<any> {
    //importShapefile post request, body file and name
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    const response = await fetch(
      ConfigService.backendUrl + "/mapCreator/importShapefile",
      {
        method: "POST",
        body: formData,
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error importing shapefile");
    });
    return response.json();
  }

  //get tables from postgis
  public static async getTables(): Promise<any> {
    const response = await fetch(
      ConfigService.backendUrl + "/mapCreator/getTables",
      {
        method: "GET",
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error getting tables");
    });
    return response.json();
  }

  //get all columns from table
  public static async getColumns(table: string): Promise<any> {
    if (!table) {
      return Promise.resolve([]);
    }
    const response = await fetch(
      ConfigService.backendUrl + "/mapCreator/getColumns",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: table,
        }),
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error getting columns");
    });
    return response.json();
  }

  //generate json from mapGeneratorModel
  public static async generateJson(data: MapGeneratorModel): Promise<any> {
    const response = await fetch(
      ConfigService.backendUrl + "/mapCreator/generateJson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating json");
    });
    return response.json();
  }
}
