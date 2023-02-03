/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "./configService";
import Puzzles from "../../backend/src/models/puzzles";
import { PieceProps } from "../models/Interfaces";
import { PuzzleService } from "./puzzleService";
import Countries from "../../backend/src/models/countries";

export class BackMapEditorService {
  //call endpoint get generateSitemap return xml sitemap
  public static generateSitemap(): Promise<any> {
    return fetch(ConfigService.backendUrl + "/mapEditor/generateSitemap", {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    })
      .then((response) => {
        //response is a xml
        return response.text();
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject("Error generating sitemap");
      });
  }
  //get all countries 
  public static async getCountries(): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/mapEditor/getCountries", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error getting countries");
    });
    return response.json();
  }
  

  //update pieceProps with wiki info and centroids
  public static async updatePieceProps(piece: PieceProps): Promise<PieceProps> {
    const wikiInfo = await PuzzleService.getCustomWiki(
      piece.id ? piece.id : -1,
      piece.properties.cartodb_id
    );
    if (wikiInfo) {
      piece.customWiki = wikiInfo;
    }
    const customCentroid = await PuzzleService.getCustomCentroid(
      piece.id ? piece.id : -1,
      piece.properties.cartodb_id
    );
    if (customCentroid) {
      piece.customCentroid = customCentroid;
    }
    return piece;
  }

  //save a puzzle
  public static async savePuzzle(puzzle: Puzzles): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/mapEditor/savePuzzle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ puzzle }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error saving puzzle");
    });
    return response.json();
  }
  //save piece
  public static async savePiece(piece: PieceProps): Promise<any> {
    // remove geometry from piece, to not send it to the backend
    const pieceToSend = {
      id: piece.id,
      properties: {
        cartodb_id: piece.properties.cartodb_id,
        name: piece.name,
        box: piece.properties.box,
      },
      customWiki: piece.customWiki,
      customCentroid: piece.customCentroid,
    } as PieceProps;

    const response = await fetch(ConfigService.backendUrl + "/mapEditor/savePiece", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pieceToSend }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error saving piece");
    });
    return response.json();
  }
}
