/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "@mappuzzle/core";
import type { MapGeneratorModel } from "@mappuzzle/shared";

export class BackMapCreatorService {
  //upload a zipped shapefile for the importer to read
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

  //list the shapefile layers available to import
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
