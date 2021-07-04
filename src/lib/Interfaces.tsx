export interface PieceProps {
  properties: {
    cartodb_id: number;
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
  };
}
