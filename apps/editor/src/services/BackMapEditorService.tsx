/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "@mappuzzle/core";
import type { Puzzles } from "@mappuzzle/shared";
import type { PieceProps } from "@mappuzzle/shared";
import { PuzzleService } from "@mappuzzle/core";
import { readProgress, type JobProgress } from "./BackWikiService";

export class BackMapEditorService {
  /**
   * Builds the share card for every puzzle. Runs for a couple of minutes, so it
   * reports progress the same way the content jobs do: newline-delimited JSON
   * over the same response, with the result on the last line.
   */
  public static async generateOgImages(
    onProgress?: (p: JobProgress) => void
  ): Promise<any> {
    const response = await fetch(
      ConfigService.backendUrl + "/mapEditor/generateOgImages",
      { method: "GET" }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating share cards");
    });
    return readProgress(response, onProgress);
  }

  /**
   * Works out each piece's centre, area and neighbours. Minutes of work over
   * 2,371 pieces, so it reports progress like the content jobs.
   */
  public static async enrichPieces(
    onProgress?: (p: JobProgress) => void
  ): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/mapEditor/enrichPieces", {
      method: "GET",
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error enriching pieces");
    });
    return readProgress(response, onProgress);
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

  //get all countrieFlags
  public static async getCountryFlags(): Promise<any> {
    //getFlags
    const response = await fetch(ConfigService.backendUrl + "/mapEditor/getFlags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error getting flags");
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

  public static async replacePieceFlag(
    id: number,
    cartodb_id: number,
    imageUrl?: string,
    file?: File
  ): Promise<any> {
    const form = new FormData();
    form.append("id", String(id));
    form.append("cartodb_id", String(cartodb_id));
    if (imageUrl && imageUrl.trim() !== "") {
      form.append("imageUrl", imageUrl.trim());
    }
    if (file) {
      form.append("file", file, file.name);
    }
    const response = await fetch(ConfigService.backendUrl + "/mapEditor/replacePieceFlag", {
      method: "POST",
      body: form,
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error replacing piece flag");
    });
    return response.json();
  }
}
