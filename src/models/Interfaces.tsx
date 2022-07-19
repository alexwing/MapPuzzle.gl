export interface PieceProps {
  properties: {
    cartodb_id: number;
    name: string;
    box: string;
  };
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

