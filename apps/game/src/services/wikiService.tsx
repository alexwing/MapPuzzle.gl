/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { mapWikiResponseToWikiInfo } from "../lib/mappings/modelMappers";
import { getLang } from "../lib/Utils";
import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { ConfigService } from "./configService";
import { QueryClient } from "react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ConfigService.staleTime,
    },
  },
});

// get wiki info for a piece
async function getWikiInfoAxios(piece: string): Promise<WikiInfoPiece> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|langlinks&llprop=langname|autonym&lllimit=500&format=json&exintro=&titles=${piece}`;
    const response = await axios.get(url);
    const wikiInfo: WikiInfoPiece = mapWikiResponseToWikiInfo(response.data);
    try {
      wikiInfo.image = await getWikiImage(piece);
    } catch (e: any) {
      console.log(e);
    }

    const puzzleLanguage = getLang();
    if (puzzleLanguage !== ConfigService.defaultLang) {
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

async function getWikiImageAxios(piece: string): Promise<string> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&formatversion=2&piprop=original&format=json&prop=pageimages&titles=${piece}`;
    const response = await axios.get(url);
    const page = response.data.query.pages[0];
    return page.original.source;
  } catch (e: any) {
    console.log(e);
    return "";
  }
}
async function changeLanguageAxios(
  piece: WikiInfoPiece,
  lang: string
): Promise<string[]> {
  try {
    const pieceLang: WikiInfoLang | undefined = piece.langs.find(
      (x: WikiInfoLang) => x.lang === lang
    );
    if (typeof pieceLang === "object" && pieceLang !== null) {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles=${pieceLang.id}`;
      const response = await axios.get(url);
      const json = response.data;
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

// get wiki info for a piece with react-query
export async function getWikiInfo(piece: string): Promise<WikiInfoPiece> {
  return await queryClient.fetchQuery(["wikiInfo", piece], async () => {
    return (await getWikiInfoAxios(piece)) as WikiInfoPiece;
  });
}
// get wiki image for a piece with react-query
export function getWikiImage(piece: string) : Promise<string> {
  return queryClient.fetchQuery(["wikiImage", piece], async () => {
    return await getWikiImageAxios(piece);
  });
}

// change language for a piece with react-query
export function changeLanguage(piece: WikiInfoPiece, lang: string) : Promise<string[]> {
  return queryClient.fetchQuery(["changeLanguage", piece, lang], async () => {
    return await changeLanguageAxios(piece, lang);
  });
}
