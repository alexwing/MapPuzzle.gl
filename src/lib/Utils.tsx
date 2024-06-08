import GameTime from "../lib/GameTime";
import React from "react";
import { ViewState } from "react-map-gl";
import CustomWiki from "../../backend/src/models/customWiki";
import { PieceProps, WikiInfoLang } from "../models/Interfaces";
import { getCookie } from "react-simple-cookie-store";
import Languages from "../../backend/src/models/languages";
import { ConfigService } from "../services/configService";
import { TFunction } from "i18next";
import { SqlValue } from "sql.js";
import i18n from 'i18next';

export const colorStroke = [150, 150, 150];
export const lineWidth = 1;

/**
 * Returns an array of RGB values representing a color on a scale from negative to positive.
 * @param x - The value to determine the color for.
 * @returns An array of three numbers representing the red, green, and blue values of the resulting color.
 */
export function colorScale(x: number): number[] {
  const COLOR_SCALE = [
    // negative
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],

    // positive
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [189, 0, 38],
    [128, 0, 38],
  ];
  const i = Math.round(x * 7) + 4;
  if (x < 0) {
    return COLOR_SCALE[i] || COLOR_SCALE[0];
  }
  return COLOR_SCALE[i] || COLOR_SCALE[COLOR_SCALE.length - 1];
}

export const hexToRgb = function (hex: string | null): Array<number> {
  if (!hex) return [0, 0, 0];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

/**
 * Lightens or darkens a given color by a specified amount.
 * @param col - The color to lighten or darken, in hexadecimal format.
 * @param amt - The amount to lighten or darken the color by, as a number between -1 and 1.
 * @returns An array of three numbers representing the red, green, and blue values of the resulting color.
 */
export function LightenDarkenColor(col: string, amt: number): Array<number> {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  let r = parseInt(col[0]) * amt;
  let g = parseInt(col[1]) * amt;
  let b = parseInt(col[2]) * amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return [r, g, b];
}

/**
 * Sets the color of a given number as a string.
 * @param col - The number to set the color for.
 * @returns The color as a string.
 */
export function setColor(col: number): string {
  const colorArray = [
    "#fef400",
    "#67ba2e",
    "#eb891a",
    "#00913c",
    "#dc261b",
    "#00938d",
    "#815329",
    "#dc2053",
    "#005ca1",
    "#df127b",
    "#291670",
    "#811e78",
    "#ce9572",
    "#a3c828",
    "#7a7a7a",
    "#b5b5b5",
    "#93a42a",
    "#d7a94a",
    "#6fa2e3",
    "#c28dc7",
    "#8ec5a9",
    "#f0c27a",
    "#95d1c4",
    "#f5e0b7",    
    "#3e4a66",
    "#aa6f73",
    "#4a9068",
    "#d692ae",
    "#507dbc",
    "#ab83a1",
    "#6d9dc5",
    "#c0b283",
    "#b06e79",
    "#6c876d",
  ];

  if (col < colorArray.length) {
    return colorArray[col];
  } else {
    do {
      col = col - colorArray.length;
    } while (col > colorScale.length);
    return colorArray[Math.abs(col)];
  }
}

/**
 * Converts a hex color code to an RGBA color array with the specified alpha value.
 * @param col - The hex color code to convert.
 * @param alpha - The alpha value to use for the RGBA color array. Defaults to 255.
 * @returns An RGBA color array with the specified alpha value.
 */
export function AlphaColor({
  col,
  alpha = 255,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  col: any | string;
  alpha?: number;
}): Array<number> {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  let r: number = parseInt(col[0]);
  let g: number = parseInt(col[1]);
  let b: number = parseInt(col[2]);

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return [r, g, b, alpha];
}

/**
 * Fetches a JSON file from the specified filepath and returns its contents as a Promise.
 * @param filepath - The path to the JSON file to fetch.
 * @returns A Promise that resolves to the contents of the fetched JSON file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function Jsondb(filepath: string): Promise<any> {
  return fetch(filepath, {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}

/**
 * Converts a number of seconds to an object representing the equivalent time in hours, minutes, and seconds.
 * @param secs - The number of seconds to convert.
 * @returns An object representing the equivalent time in hours, minutes, and seconds.
 */
export function secondsToTime(secs: number): {
  h: number;
  m: number;
  s: number;
} {
  const hours = Math.floor(secs / (60 * 60));

  const divisor_for_minutes = secs % (60 * 60);
  const minutes = Math.floor(divisor_for_minutes / 60);

  const divisor_for_seconds = divisor_for_minutes % 60;
  const seconds = Math.ceil(divisor_for_seconds);
  return {
    h: hours,
    m: minutes,
    s: seconds,
  };
}

/**
 * Returns a JSX element representing the time in a formatted way, based on the number of seconds passed.
 * If the time is greater than an hour, it returns the time in hours, minutes, and seconds.
 * If the time is greater than a minute, it returns the time in minutes and seconds.
 * If the time is less than a minute, it returns the time in seconds.
 * @param t - The translation function to use for formatting the time.
 * @returns A JSX element representing the time in a formatted way.
 */
export function getTime(t: TFunction): JSX.Element | undefined {
  const time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return (
      <span id="hours">
        {t("common.time.hours", {
          hours: time.h,
          minutes: time.m,
          seconds: time.s,
        })}
      </span>
    );
  } else if (time.m > 0) {
    return (
      <span id="minutes">
        {t("common.time.minutes", { minutes: time.m, seconds: time.s })}
      </span>
    );
  } else if (time.s > 0) {
    return (
      <span id="seconds">{t("common.time.seconds", { seconds: time.s })}</span>
    );
  }
}

/**
 * Returns a string representing the time in a formatted way, based on the number of seconds passed.
 * If the time is greater than an hour, it returns the time in hours, minutes, and seconds.
 * If the time is greater than a minute, it returns the time in minutes and seconds.
 * If the time is less than a minute, it returns the time in seconds.
 * @param t - The translation function to use for formatting the time.
 * @returns A string representing the time in a formatted way.
 */
export function getTexTime(t: TFunction): string | undefined {
  const time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return t("common.time.hours", {
      hours: time.h,
      minutes: time.m,
      seconds: time.s,
    });
  } else if (time.m > 0) {
    return t("common.time.minutes", { minutes: time.m, seconds: time.s });
  } else if (time.s > 0) {
    return t("common.time.seconds", { seconds: time.s });
  }
}

/**
 * Returns the current URL of the page, excluding the protocol and path.
 * If the URL includes "localhost", it returns "mappuzzle.xyz".
 * @returns The current URL of the page.
 */
export function getUrl(): string {
  const url = window.location.href.split("/")[2];
  if (url.includes("localhost")) {
    return "mappuzzle.xyz";
  }
  return url;
}

/**
 * Removes HTML comments, references, and audio descriptions from a given array of strings.
 * @param html - The array of strings to remove HTML comments, references, and audio descriptions from.
 * @returns The array of strings without HTML comments, references, and audio descriptions.
 */
export function cleanWikiComment(html: string[]): string[] {
  //remove comment
  let htmlAux = cleanHtmlComment(html.join(""));

  //remove references <sup>...</sup>
  htmlAux = htmlAux.replace(/<sup[\s\S]*?<\/sup>/g, "");
  //remove audio description
  htmlAux = htmlAux.replace(
    "<span>(<span><span><span></span>listen</span></span>)</span>",
    ""
  );
  htmlAux = htmlAux.replace(
    '<small class="nowrap">&nbsp;( escuchar)</small>',
    ""
  );

  //convert string to array
  return [htmlAux];
}

/**
 * Removes HTML comments from a given string.
 * @param html - The string to remove HTML comments from.
 * @returns The string without HTML comments.
 */
function cleanHtmlComment(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Cleans a given name to generate a Wikipedia URL.
 * @param name - The name to clean.
 * @returns The cleaned Wikipedia URL.
 */
function cleanNameToWiki(name: string): string {
  let wiki_url = name.trim();
  wiki_url = wiki_url.replace("(disputed)", "");
  //if include string " - " split and take the first part
  if (wiki_url.includes(" - ")) {
    wiki_url = wiki_url.split(" - ")[0];
  }
  //replace - to space
  //wiki_url = wiki_url.replace(/-/g, " ");
  //remove (Disputed)
  wiki_url = wiki_url.replace(/ /g, "_");
  return wiki_url;
}

/**
 * Returns a Wikipedia URL for a given name and custom Wikipedia URL, if available.
 * If a custom Wikipedia URL is not available, it generates a Wikipedia URL from the name.
 * @param cartodb_id - The cartodb_id of the feature.
 * @param name - The name to generate a Wikipedia URL from.
 * @param custom_wiki - An array of custom Wikipedia URLs, if available.
 * @returns The Wikipedia URL.
 */
export function getWiki(
  cartodb_id: number,
  name: string,
  custom_wiki: CustomWiki[]
): string {
  let wiki_url = "";
  if (custom_wiki) {
    wiki_url =
      custom_wiki.find((x: CustomWiki) => x.cartodb_id === cartodb_id)?.wiki ||
      "";
  }
  if (wiki_url !== "") {
    return wiki_url;
  } else {
    return cleanNameToWiki(name);
  }
}

/**
 * Returns a Wikipedia URL for a given name and custom Wikipedia URL, if available.
 * If a custom Wikipedia URL is not available, it generates a Wikipedia URL from the name.
 * @param name - The name to generate a Wikipedia URL from.
 * @param custom_wiki - A custom Wikipedia URL, if available.
 * @returns The Wikipedia URL.
 */
export function getWikiSimple(name: string, custom_wiki: string): string {
  let wiki_url = "";
  if (custom_wiki) {
    wiki_url = custom_wiki;
  }
  if (wiki_url !== "") {
    return wiki_url;
  } else {
    return cleanNameToWiki(name);
  }
}

/**
 * Copies the view state from one object to another, preserving the bearing and pitch of the destination view state.
 * @param viewStateOrigin - The view state object to copy from.
 * @param viewStateDestination - The view state object to copy to.
 * @returns The updated view state object.
 */
export function copyViewState(
  viewStateOrigin: ViewState,
  viewStateDestination: ViewState
): ViewState {
  if (!viewStateDestination) {
    viewStateDestination = {
      latitude: parseFloat(viewStateOrigin.latitude.toString()),
      longitude: parseFloat(viewStateOrigin.longitude.toString()),
      zoom: parseFloat(viewStateOrigin.zoom.toString()),
      bearing: 0,
      pitch: 0,
    };
  } else {
    viewStateDestination = {
      latitude: parseFloat(viewStateOrigin.latitude.toString()),
      longitude: parseFloat(viewStateOrigin.longitude.toString()),
      zoom: parseFloat(viewStateOrigin.zoom.toString()),
      bearing: viewStateDestination.bearing,
      pitch: viewStateDestination.pitch,
    };
  }
  return viewStateDestination;
}
/**
 * Returns the class name for a table row based on whether it is selected or not.
 * @param c - A PieceProps object containing information about a table row.
 * @param pieceSelected - The ID of the currently selected table row.
 * @returns The class name as a string.
 */
export function className(c: PieceProps, pieceSelected: number): string {
  return c.properties.cartodb_id === pieceSelected ? "table-primary" : "";
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
 * Converts a value to a number.
 * @param value - The value to convert.
 * @returns The converted number.
 */
export function convertToNumber(value: SqlValue): number {
  if (typeof value === "number") {
    return value;
  } else {
    if (value === null) {
      return 0;
    } else if (value === undefined) {
      return 0;
    } else if (value === "") {
      return 0;
    } else if (value === "null") {
      return 0;
    } else if (value === "undefined") {
      return 0;
    } else if (value === "NaN") {
      return 0;
    } else if (value === "nan") {
      return 0;
    } else if (value === "NAN") {
      return 0;
    } else if (value === "Nan") {
      //Uint8Array
    } else if (value instanceof Uint8Array) {
      return 0;
      //is has comma
    } else if (value.includes(",")) {
      return parseFloat(value.replace(",", "."));
    } else {
      return parseFloat(value);
    }
  }
  return 0;
}


/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param arr - The array to shuffle.
 * @returns An iterable iterator of the shuffled array.
 */
export function* shuffle<T>(arr: T[]): IterableIterator<T> {
  arr = [...arr];
  while (arr.length) yield arr.splice((Math.random() * arr.length) | 0, 1)[0];
}

/* clean url params */
export function cleanUrlParams(url: string): string {
  const index = url.indexOf("&");
  if (index > -1) {
    return url.substring(0, index);
  } else {
    return url;
  }
}

/**
 * Calculates the zoom level based on the given bounding box and viewport dimensions.
 * @param bbox - The bounding box of the map.
 * @returns The calculated zoom level.
 */
export function calculateZoom(bbox: number[]): number {
  const viewportWidth = window.innerWidth;
  /** The height of the viewport. */
  const viewportHeight = window.innerHeight;
  const [west, south, east, north] = bbox;
  const viewportSize = Math.min(viewportWidth, viewportHeight);
  const lngDiff = east - west;
  const latDiff = north - south;
  const lngZoom = Math.log2(((360 / 512) * viewportSize) / lngDiff);
  const latZoom = Math.log2(((180 / 512) * viewportSize) / latDiff);
  const zoom = Math.min(lngZoom, latZoom);

  return Math.round(zoom);
}


/**
 * Calculates distance proportion from ecuador based on the given latitude.
 * @param bbox - The bounding box of the map.
 * @returns The calculated distance porcentage from ecuador. 
 */
export function calculateDistanceFromEcuador(lat: number): number {
  return Math.abs(lat) / 100;
}


/**
 * Returns the translation for a given code and parent.
 * @param parent - The parent of the translation.
 * @param code - The code of the translation.
 * @param noTranslation - The default translation if the code is not found.
 * @returns The translation as a string.
 */
export function getTranslation(parent, code: string, noTranslation?: string) {
  let translation = "";
  
  if (code) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const possibleTranslation =  i18n.t(parent + '.' + code);
    if (typeof possibleTranslation === "string" && possibleTranslation !== parent + '.' + code ) {
      translation = possibleTranslation;
    }
  }
  if (noTranslation && translation === "") {
    translation = noTranslation;
  }
  return translation;
}