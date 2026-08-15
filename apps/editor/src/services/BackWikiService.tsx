/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigService } from "@mappuzzle/core";
import type { CustomTranslations } from "@mappuzzle/shared";
import type { Languages } from "@mappuzzle/shared";
import type { PieceProps } from "@mappuzzle/shared";
import { WikiInfoLang, WikiInfoPiece } from "@mappuzzle/core";
import { getWikiInfo } from "@mappuzzle/core";
import { getWikiSimple } from "@mappuzzle/core";

/** What a running job reports: where it is and what it is on. */
export interface JobProgress {
  done: number;
  total: number;
  label: string;
}

/**
 * Reads the backend's newline-delimited progress and returns the final result.
 *
 * These jobs walk every piece and pause between Wikipedia calls, so they run for
 * minutes. The response is consumed as a stream: every line but the last is a
 * progress event, and the last one is the result the caller used to await.
 */
export async function readProgress(
  response: Response,
  onProgress?: (p: JobProgress) => void
): Promise<any> {
  if (!response.body) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: any;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // The tail may be half a line; it waits for the next chunk.
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === "progress") onProgress?.(event as JobProgress);
        else result = event;
      } catch {
        // A malformed line should not lose the rest of the job.
        console.warn("Unreadable progress line:", line);
      }
    }
  }
  if (buffer.trim()) {
    try {
      result = JSON.parse(buffer);
    } catch {
      /* nothing usable at the end */
    }
  }
  return result ?? { success: false, msg: "The job ended without a result" };
}

export class BackWikiService {
  //generate thumbnail for a pieces
  public static async generateThumbnail(
    id: number,
    onProgress?: (p: JobProgress) => void
  ): Promise<any> {
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
    return readProgress(response, onProgress);
  }

  //generate flags for a pieces
  public static async generateFlags(
    pieces: PieceProps[],
    id: number,
    onProgress?: (p: JobProgress) => void
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
    return readProgress(response, onProgress);
  }

  //generate translation for a pieces
  public static async generateTranslation(
    pieces: PieceProps[],
    id: number,
    onProgress?: (p: JobProgress) => void
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
    return readProgress(response, onProgress);
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
    subFix: string,
    onProgress?: (p: JobProgress) => void
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
    return readProgress(response, onProgress);
  }
}
