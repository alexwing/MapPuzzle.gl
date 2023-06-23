import CustomCentroids from "../../backend/src/models/customCentroids";
import CustomWiki from "../../backend/src/models/customWiki";
import { ViewState } from "react-map-gl";
export interface PieceEvent {
  color: Uint8Array;
  coordinate: number[];
  devicePixel: number[];
  featureType: string;
  index: number;
  object: PieceProps;
  pixel: number[];
  viewport: {
    x: number;
    y: number;
  };
}

export interface ViewStateEvent {
  iterationState: {
    inTransition: boolean;
    isDragging: boolean;
    isPanning: boolean;
    isRotating: boolean;
    isZooming: boolean;
  };
  oldViewState: ViewState;
  viewState: ViewState;
  viewId: string;
}

export interface PieceProps {
  id?: number;
  geometry: MultiPolygon;
  name: string;
  properties: {
    cartodb_id: number;
    name: string;
    box: string;
    mapcolor: number;
    poly: string;
    longitude: number;
    latitude: number;
  };
  customCentroid?: CustomCentroids;
  customWiki?: CustomWiki;
}

export interface MultiPolygon {
  type: string;
  coordinates: number[][][];
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
  image?: string;
  langs: WikiInfoLang[];
}

export interface WikiInfoLang {
  id: string; //lang piece name
  lang: string; // lang code
  langname: string; // lang name
  autonym: string; // lang name english
  rtl: boolean; // right to left
}

export interface AlertModel {
  title: string;
  message: string;
  type: "danger" | "success" | "warning";
}

export interface MapGeneratorModel {
  table: string;
  id: string;
  name: string;
  mapColor: string;
  fileJson: string;
}
export interface FlagsIcons {
  name: string;
  url: string;
}
  