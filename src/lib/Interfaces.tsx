export interface PieceProps {
  properties: {
    cartodb_id: number;
    name: string;
    box: string;
  };
}

export interface MapPuzzleProps {
  id: number;
  name: string;
  comment: string;
  data: string;
  url: string;
  icon: string;
  view_state: {
    latitude: number;
    longitude: number;
    zoom: number;
  },  
  custom_wiki: {
    cartodb_id: number;
    name: string;
    wiki: string;
  }[],
  custom_centroids: {
    cartodb_id: number;
    name: string;
    left: number;
    top: number;
  }[];

}
