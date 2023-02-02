/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "./configService";
import CustomTranslations from "../../backend/src/models/customTranslations";
import Languages from "../../backend/src/models/languages";
import { PieceProps, WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { getWikiInfo } from "./wikiService";
import { getWikiSimple } from "../lib/Utils";

export class BackWikiService {
  //generate thumbnail for a pieces
  public static async generateThumbnail(id: number): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/wikiImport/generateThumbs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating thumbnails");
    });
    return response.json();
  }

  //generate flags for a pieces
  public static async generateFlags(
    pieces: PieceProps[],
    id: number
  ): Promise<any> {
    const response = await fetch(ConfigService.backendUrl + "/wikiImport/generateFlags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        pieces,
      }),
    }).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating flags");
    });
    return response.json();
  }

  //generate translation for a pieces
  public static async generateTranslation(
    pieces: PieceProps[],
    id: number
  ): Promise<any> {
    const languages: Languages[] = [];
    const translations: CustomTranslations[] = [];

    for await (const piece of pieces) {
      piece.id = id;
      //get custom wiki info
      const wiki = getWikiSimple(
        piece.name,
        piece.customWiki ? piece.customWiki.wiki : ""
      );
      //get wikiService getWikiInfo
      await this.getWikiInfo(wiki, languages, piece, translations);
    }
    //await 5 seconds to wait for the translations to be generated
    //await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await fetch(
      ConfigService.backendUrl + "/wikiImport/generateTranslation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languages: languages,
          translations: translations,
        }),
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating translation");
    });
    return response.json();
  }

  private static async getWikiInfo(
    wiki: string,
    languages: Languages[],
    piece: PieceProps,
    translations: CustomTranslations[]
  ) {
    await getWikiInfo(wiki)
      .then((wikiInfo: WikiInfoPiece) => {
        if (wikiInfo.langs.length > 0) {
          wikiInfo.langs.forEach((lang: WikiInfoLang) => {
            //if not exist in languages, add it
            if (!languages.some((l) => l.lang === lang.lang)) {
              languages.push({
                lang: lang.lang,
                langname: lang.langname,
                autonym: lang.autonym,
              } as Languages);
            }
            if (piece.id) {
              translations.push({
                id: piece.id,
                cartodb_id: piece.properties.cartodb_id,
                lang: lang.lang,
                translation: lang.id,
              } as CustomTranslations);
            }
          });
        } else {
          if (!languages.some((l) => l.lang === "error")) {
            languages.push({
              lang: "error",
              langname: "Error",
              autonym: "Error",
            } as Languages);
          }
          translations.push({
            id: piece.id,
            cartodb_id: piece.properties.cartodb_id,
            lang: "Error",
            translation: piece.name,
          } as CustomTranslations);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //generate wikilins for a pieces
  public static async generateWikiLinks(
    pieces: PieceProps[],
    id: number,
    subFix: string
  ): Promise<any> {
    const response = await fetch(
      ConfigService.backendUrl + "/wikiImport/generateWikiLinks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          pieces,
          subFix: subFix,
        }),
      }
    ).catch((err) => {
      console.log(err);
      return Promise.reject("Error generating wiki links");
    });
    return response.json();
  }
}
