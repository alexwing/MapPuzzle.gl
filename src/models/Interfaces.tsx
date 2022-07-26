import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";

export interface PieceProps {
  id?: number;
  properties: {
    cartodb_id: number;
    name: string;
    box: string;
  };
  customCentroid?: CustomCentroids;
  customWiki?: CustomWiki;
}

export interface WikiInfoPiece {
  title: string;
  contents: string[];
  langs: string[];
}

export interface WikiInfoLang{
  id: string;
  lang: string;
  langname: string;
  autonym: string;
}

export interface AlertModel {
  title: string;
  message: string;
  type:  "danger" | "success" | "warning";
}

