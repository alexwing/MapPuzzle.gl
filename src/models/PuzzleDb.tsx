import { ViewState } from "react-map-gl";

//custom_centroids data interface
export interface CustomCentroids {
  id: number;
  cartodb_id: number;
  name: string;
  left: number;
  top: number;
}

//custom_wiki data interface
export interface CustomWiki {
  id: number;
  cartodb_id: number;
  name: string;
  wiki: string;
}
