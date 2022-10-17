import { QueryExecResult, SqlValue } from "sql.js";
import CustomCentroids from "../../../backend/src/models/customCentroids";
import CustomTranslations from "../../../backend/src/models/customTranslations";
import CustomWiki from "../../../backend/src/models/customWiki";
import Languages from "../../../backend/src/models/languages";
import Puzzles from "../../../backend/src/models/puzzles";
import { WikiInfoLang, WikiInfoPiece } from "../../models/Interfaces";
import { sortLangs } from "../Utils";

//map the result data to a QueryExecResult[]
export function mapResultToQueryExecResult(data: any[]): QueryExecResult[] {
  let queryExecResults: QueryExecResult[] = [];
  let columns: string[] = [];
  let values: SqlValue[][] = [];
  let first: boolean = true;
  data.forEach((element) => {
    let value: SqlValue[] = [];
    for (let prop in element) {
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
    view_state: {
      latitude: parseFloat((result[8] as string)),
      longitude: parseFloat((result[9] as string)),
      zoom: parseFloat((result[10] as string)),
    },
  } as Puzzles;
}

//map the result to a language 
export function  mapResultToLanguage(result: SqlValue[]): Languages {
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
      left: parseFloat((result[2] as string)),
      top:  parseFloat((result[3] as string))
    } as CustomCentroids;
  }


//map wiki response to wiki info
export function mapWikiResponseToWikiInfo(_response: any): WikiInfoPiece {
    const { pages } = _response.query;
    const page = pages[Object.keys(pages)[0]];
    const title = page.title;
    const contents = page.extract.split("\n");
    let langs = page.langlinks.map((x: any) => {
      return {
        id: x["*"],
        lang: x.lang,
        langname: x.langname,
        autonym: x.autonym,
      } as WikiInfoLang;
    });
    //add english to lang
    langs.push({
      id: title,
      lang: "en",
      langname: "English",
      autonym: "English",
    } as WikiInfoLang);
    //order langs by langname
    langs = sortLangs(langs);
    return {
      title,
      contents,
      langs,
    };
  }