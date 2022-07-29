import { getCookie } from "react-simple-cookie-store";
import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";

//get wiki info for a piece
export async function getWikiInfo(piece: string): Promise<WikiInfoPiece> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|langlinks&llprop=langname|autonym&lllimit=500&format=json&exintro=&titles=${piece}`;
    const response = await fetch(url);
    const json = await response.json();
    let wikiInfo: WikiInfoPiece = mapWikiResponseToWikiInfo(json);
    
    const puzzleLanguage = getCookie("puzzleLanguage") || "en";
    if (puzzleLanguage !== "en") {
      wikiInfo.contents = await changeLanguage(wikiInfo, puzzleLanguage);     
    }
    return wikiInfo;
  } catch (e: any) {
    return {
      title: "Not found data on Wikipedia",
      contents: [e.message],
      langs: [],
    };
  }
}
export async function changeLanguage(
  piece: WikiInfoPiece,
  lang: string
): Promise<string[]> {
  try {
    const pieceLang: any = piece.langs.find((x: any) => x.lang === lang);
    if (typeof pieceLang === "object" && pieceLang !== null) {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles=${pieceLang.id}`;
      const response = await fetch(url);
      const json = await response.json();
      const { pages } = json.query;
      const page = pages[Object.keys(pages)[0]];
      return page.extract.split("\n");
    } else {
      return [];
    }
  } catch (e: any) {
    return ["Not found data on Wikipedia"];
  }
}

//map wiki response to wiki info
function mapWikiResponseToWikiInfo(_response: any): WikiInfoPiece {
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

function sortLangs(langs: WikiInfoLang[]): WikiInfoLang[] {
  langs.sort((a: any, b: any) => {
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


