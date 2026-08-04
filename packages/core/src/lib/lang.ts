/**
 * The player's language and the language metadata shown next to wiki content.
 */

import { getCookie } from "react-simple-cookie-store";
import type { Languages } from "@mappuzzle/shared";
import { ConfigService } from "../services/configService";
import { WikiInfoLang } from "../types";

/**
 * Gets the language code for the current user, based on their browser language or a saved cookie.
 * @returns The language code as a string.
 */
export function getLang(): string {
  const lang = getCookie("puzzleLanguage");
  if (lang === undefined || lang === "") {
    let browserLang = navigator.language;
    if (browserLang.includes("-")) {
      browserLang = navigator.language.split("-")[0];
    }
    const lang = ConfigService.langs.find((x: string) => x === browserLang);
    if (lang !== undefined) {
      return lang;
    } else {
      return ConfigService.defaultLang;
    }
  } else {
    return lang;
  }
}

/**
 * Returns the language name with the autonym if available.
 * @param piece - A WikiInfoLang object containing information about a language.
 * @returns The language name as a string.
 */
export function langName(piece: WikiInfoLang): string {
  if (piece.autonym === "") {
    return piece.langname;
  } else {
    if (piece.autonym === piece.langname) {
      return piece.langname;
    } else {
      return piece.langname + " (" + piece.autonym + ")";
    }
  }
}

/**
 * Gets the current language based on the user's selected language and an array of WikiInfoLang objects.
 * @param langs - An array of WikiInfoLang objects.
 * @returns The current language as a string.
 */
export function getCurrentLang(langs: WikiInfoLang[]): string {
  const puzzleLanguage = getLang();
  //find in pieceInfo.langs the lang with the same lang as puzzleLanguage
  let pieceLang = langs.find((x: WikiInfoLang) => x.lang === puzzleLanguage);
  if (typeof pieceLang === "object" && pieceLang !== null) {
    return langName(pieceLang);
  } else {
    pieceLang = langs.find(
      (x: WikiInfoLang) => x.lang === ConfigService.defaultLang
    );
    if (typeof pieceLang === "object" && pieceLang !== null) {
      return langName(pieceLang);
    } else {
      return "Unknown";
    }
  }
}

/**
 * Gets the title of the language from an array of WikiInfoLang objects based on the current language.
 * @param langs - An array of WikiInfoLang objects.
 * @returns The title of the language as a string.
 */
export function getTitleFromLang(langs: WikiInfoLang[]): string {
  //find in pieceInfo.langs the lang with the same lang as puzzleLanguage
  const lang = getLang();
  const pieceLang = langs.find((x: WikiInfoLang) => x.lang === lang);
  if (typeof pieceLang === "object" && pieceLang !== null) {
    return pieceLang.id;
  } else {
    return "";
  }
}

/**
 * Converts an array of Languages objects to an array of WikiInfoLang objects.
 * @param languages - An array of Languages objects to be converted.
 * @returns An array of WikiInfoLang objects.
 */
export function languagesToWikiInfoLang(
  languages: Languages[]
): WikiInfoLang[] {
  return languages.map((lang: Languages) => {
    return {
      lang: lang.lang,
      name: lang.lang,
      langname: lang.langname,
      autonym: lang.autonym,
      rtl: lang.rtl,
    } as unknown as WikiInfoLang;
  });
}

/**
 * Sorts an array of WikiInfoLang objects by their langname property.
 * @param langs - An array of WikiInfoLang objects to be sorted.
 * @returns A sorted array of WikiInfoLang objects.
 */
export function sortLangs(langs: WikiInfoLang[]): WikiInfoLang[] {
  langs.sort((a: WikiInfoLang, b: WikiInfoLang) => {
    if (a.langname < b.langname) {
      return -1;
    }
    if (a.langname > b.langname) {
      return 1;
    }
    return 0;
  });
  return langs;
}
