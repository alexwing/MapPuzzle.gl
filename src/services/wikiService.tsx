import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";

//get wiki info for a piece
export async function getWikiInfo(piece: string): Promise<WikiInfoPiece> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|langlinks&format=json&exintro=&titles=${piece}`;
    const response = await fetch(url);
    const json = await response.json();
    return mapWikiResponseToWikiInfo(json);
  } catch (e: any) {
    return {
      title: "Not found data on Wikipedia",
      contents: [e.message],
      langs: [],
    };
  }
}
//map wiki response to wiki info
function mapWikiResponseToWikiInfo(_response: any): WikiInfoPiece {
  const { pages } = _response.query;
  const page = pages[Object.keys(pages)[0]];
  const title = page.title;
  const contents = page.extract.split("\n");
  const langs = page.langlinks.map((x: any) => {
    return {
      id: x["*"],
      lang: x.lang,
    } as WikiInfoLang;
  });

  return {
    title,
    contents,
    langs,
  };
}