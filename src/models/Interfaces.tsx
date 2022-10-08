import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";

export interface PieceProps {
  id?: number;
  geometry: any;
  name: string;
  properties: {
    cartodb_id: number;
    name: string;
    box: string;
  };
  customCentroid?: CustomCentroids;
  customWiki?: CustomWiki;
}

export interface Regions {
  regionCode: number;
  region: string;
  subregionCode: number;
  subregion: string;
}

export interface WikiInfoPiece {
  title: string;
  contents: string[];
  langs: WikiInfoLang[];  
}

export interface WikiInfoLang{
  id: string; //lang piece name
  lang: string; // lang code
  langname: string; // lang name
  autonym: string; // lang name english
  rtl: boolean; // right to left
}

export interface AlertModel {
  title: string;
  message: string;
  type:  "danger" | "success" | "warning";
}

