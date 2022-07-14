import { ViewState } from "react-map-gl";

//the puzzle data interface
export interface Puzzle {
  id: number;
  comment: string;
  data: string;
  icon: string;
  name: string;
  url: string;
  wiki: string;
  view_state: ViewState;
}

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
