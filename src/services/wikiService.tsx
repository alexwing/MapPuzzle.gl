/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCookie } from "react-simple-cookie-store";
import { mapWikiResponseToWikiInfo } from "../lib/mappings/modelMappers";
import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { ConfigService } from "./configService";

//get wiki info for a piece
export async function getWikiInfo(piece: string): Promise<WikiInfoPiece> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|langlinks&llprop=langname|autonym&lllimit=500&format=json&exintro=&titles=${piece}`;
    const response = await fetch(url);
    const json = await response.json();
    const wikiInfo: WikiInfoPiece = mapWikiResponseToWikiInfo(json);
    try {
      const urlImage = `https://en.wikipedia.org/w/api.php?action=query&origin=*&formatversion=2&piprop=original&format=json&prop=pageimages&titles=${piece}`;
      const responseImage = await fetch(urlImage);
      const jsonImage = await responseImage.json();
      const { pages } = jsonImage.query;
      const page = pages[0];
      wikiInfo.image = page.original.source;
    } catch (e: any) {
      console.log(e);
    }

    const puzzleLanguage =
      getCookie("puzzleLanguage") || ConfigService.defaultLang;
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

export async function getWikiImage(piece: string): Promise<string> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&formatversion=2&piprop=original&format=json&prop=pageimages&titles=${piece}`;
    const response = await fetch(url);
    console.log(response);
    const json = await response.json();
    const { pages } = json.query;
    const page = pages[0];
    console.log("image:", page.original.source);
    return page.original.source;
  } catch (e: any) {
    console.log(e);
    return "";
  }
}

export async function changeLanguage(
  piece: WikiInfoPiece,
  lang: string
): Promise<string[]> {
  try {
    const pieceLang: WikiInfoLang | undefined = piece.langs.find(
      (x: WikiInfoLang) => x.lang === lang
    );
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
