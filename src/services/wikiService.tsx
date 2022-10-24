import { getCookie } from "react-simple-cookie-store";
import { mapWikiResponseToWikiInfo } from "../lib/mappings/modelMappers";
import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";

//get wiki info for a piece
export async function getWikiInfo(piece: string): Promise<WikiInfoPiece> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|langlinks&llprop=langname|autonym&lllimit=500&format=json&exintro=&titles=${piece}`;
    const response = await fetch(url);
    const json = await response.json();
    const wikiInfo: WikiInfoPiece = mapWikiResponseToWikiInfo(json);
    
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
    const pieceLang: WikiInfoLang | undefined = piece.langs.find((x: WikiInfoLang) => x.lang === lang);
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





