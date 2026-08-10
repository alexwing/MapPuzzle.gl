/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryExecResult, SqlValue } from "sql.js";
import type { CustomCentroids } from "@mappuzzle/shared";
import type { CustomTranslations } from "@mappuzzle/shared";
import type { CustomWiki } from "@mappuzzle/shared";
import type { Languages } from "@mappuzzle/shared";
import type { Puzzles } from "@mappuzzle/shared";
import {
  PuzzleSearchResults,
  WikiInfoLang,
  WikiInfoPiece,
} from "../types";
import { convertToNumber } from "../lib/data";
import { sortLangs } from "../lib/lang";

//map the result data to a QueryExecResult[]
export function mapResultToQueryExecResult(data: any[]): QueryExecResult[] {
  const queryExecResults: QueryExecResult[] = [];
  let columns: string[] = [];
  let first = true;
  const values: SqlValue[][] = [];
  data.forEach((element) => {
    const value: SqlValue[] = [];
    for (const prop in element) {
      // eslint-disable-next-line no-prototype-builtins
      if (element.hasOwnProperty(prop)) {
        value.push(element[prop] as SqlValue);
      }
    }
    values.push(value);
    if (first) {
      columns = Object.keys(data[0]);
      first = false;
    }
  });

  queryExecResults.push({
    columns: columns,
    values: values,
  } as QueryExecResult);

  return queryExecResults;
}

//map the result to a CustomTranslations object
export function mapResultToCustomTranslations(
  result: SqlValue[]
): CustomTranslations {
  return {
    id: result[0],
    cartodb_id: result[1],
    lang: result[2],
    translation: result[3],
  } as CustomTranslations;
}

//map the result to a CustomWiki object
export function mapResultToCustomWiki(result: SqlValue[]): CustomWiki {
  return {
    id: result[0],
    cartodb_id: result[1],
    wiki: result[2],
  } as CustomWiki;
}

//map the result to a Puzzles object
export function mapResultToPuzzle(result: SqlValue[]): Puzzles {
  return {
    id: result[0],
    comment: result[1],
    data: result[2],
    icon: result[3],
    name: result[4],
    url: result[5],
    wiki: result[6],
    countryCode: result[7],
    enableWiki: parseInt(result[8] as string) === 1,
    enableFlags: parseInt(result[9] as string) === 1,
    view_state: {
      latitude: convertToNumber(result[10]),
      longitude: convertToNumber(result[11]),
      zoom: convertToNumber(result[12]),
    },
  } as Puzzles;
}

//map the result to a language
export function mapResultToLanguage(result: SqlValue[]): Languages {
  return {
    lang: result[0],
    langname: result[1],
    autonym: result[2],
    active: result[3],
    rtl: result[4],
  } as Languages;
}

//map the result to a CustomCentroids object
export function mapResultToCustomCentroids(
  result: SqlValue[]
): CustomCentroids {
  return {
    id: result[0],
    cartodb_id: result[1],
    left: convertToNumber(result[2]),
    top: convertToNumber(result[3]),
  } as CustomCentroids;
}

//map wiki response to wiki info
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function mapWikiResponseToWikiInfo(response: any): WikiInfoPiece {
  const pages = response?.query?.pages ?? {};
  const firstKey = Object.keys(pages)[0];
  const page = firstKey ? pages[firstKey] : {};
  const title = page?.title ?? "Not found data on Wikipedia";
  const extract = typeof page?.extract === "string" ? page.extract : "";
  const contents = extract ? extract.split("\n") : ["Not found data on Wikipedia"];
  const langlinks = Array.isArray(page?.langlinks) ? page.langlinks : [];
  let langs = langlinks.map((x: any) => {
    return {
      id: x["*"],
      lang: x.lang,
      langname: x.langname,
      autonym: x.autonym,
    } as WikiInfoLang;
  });
  //add english to lang
  if (title !== "Not found data on Wikipedia") {
    langs.push({
      id: title,
      lang: "en",
      langname: "English",
      autonym: "English",
    } as WikiInfoLang);
  }
  //order langs by langname
  langs = sortLangs(langs);
  return {
    title,
    contents,
    langs,
  };
}

//map the result to a PuzzleSearchResults object
export function mapResultToPuzzleSearchResults(
  value: any
): PuzzleSearchResults {
  return {
    id: value[0],
    comment: value[1],
    data: value[2],
    icon: value[3],
    name: value[4],
    url: value[5],
    wiki: value[6],
    countryCode: value[7],
    enableWiki: parseInt(value[8] as string) === 1,
    enableFlags: parseInt(value[9] as string) === 1,
    region: {
      regionCode: value[10],
      region: value[11],
      subregionCode: value[12],
      subregion: value[13],
    },
  };
}
