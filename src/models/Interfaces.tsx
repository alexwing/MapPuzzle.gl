import { ViewState } from "react-map-gl";
import type { Puzzles, Regions } from "@mappuzzle/shared";

/**
 * Types that only the browser needs. The contracts the backend also speaks
 * (the database row shapes plus PieceProps, MultiPolygon, Regions,
 * MapGeneratorModel and FlagsIcons) live in @mappuzzle/shared and are
 * re-exported here so existing imports keep working.
 */
export type {
  FlagsIcons,
  MapGeneratorModel,
  MultiPolygon,
  PieceProps,
  Position,
  Regions,
} from "@mappuzzle/shared";

import type { PieceProps } from "@mappuzzle/shared";

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

export interface AlertMessageProps {
  show: boolean;
  alertMessage: AlertModel;
  onHide: () => void;
  autoClose?: number ;
}

export interface ServiceWorkerConfig {
  onUpdate: (registration: ServiceWorkerRegistration) => void;
  onSuccess: (registration: ServiceWorkerRegistration) => void;
}

// extend from Puzzle interface and add the new properties regionCode, subregionCode, region, subregion
export interface PuzzleSearchResults extends Puzzles {
  region: Regions;
}
