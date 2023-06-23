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

export const colorStroke = [150, 150, 150];
export const lineWidth = 1;

export const colorScale = function (x: number): number[] {
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
};

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

export const LightenDarkenColor = function (
  col: string,
  amt: number
): Array<number> {
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
};

export const setColor = function (col: number): string {
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
  ];

  if (col < colorArray.length) {
    return colorArray[col];
  } else {
    do {
      col = col - colorArray.length;
    } while (col > colorScale.length);
    return colorArray[Math.abs(col)];
  }
};

export const AlphaColor = function (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  col: any | string,
  alpha = 255
): Array<number> {
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
};

export function ST_ExtentToVieport(box: string): string {
  box = box.replace("BOX(", "").replace(")", "").replace(",", " ");
  const arrayBox = box.split(" ");
  return (
    arrayBox[0] +
    " " +
    -(
      parseFloat(arrayBox[1]) +
      (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]))
    ) +
    " " +
    (parseFloat(arrayBox[2]) - parseFloat(arrayBox[0])) +
    " " +
    (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]))
  );
}

export function LazyRound(num: string): string {
  const parts = num.split(".");
  return parts.length > 1
    ? Math.round(
        parseInt(parts.join(""), 10) / Math.pow(1000, parts.length - 1)
      ) + ["T", "M", "B"][parts.length - 2]
    : parts[0];
}

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

export async function Querydb(sql: string): Promise<Response> {
  return fetch("https://public.carto.com/api/v2/sql?q=" + sql, {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}

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

export function getUrl(): string {
  const url = window.location.href.split("/")[2];
  if (url.includes("localhost")) {
    return "mappuzzle.xyz";
  }
  return url;
}

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

function cleanHtmlComment(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

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

export function className(c: PieceProps, pieceSelected: number): string {
  return c.properties.cartodb_id === pieceSelected ? "table-primary" : "";
}

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

export function* shuffle<T>(arr: T[]): IterableIterator<T> {
  arr = [...arr];
  while(arr.length) yield arr.splice(Math.random()*arr.length|0, 1)[0]
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
