/**
 * View types shared by the two clients.
 *
 * The database row shapes and the domain types the backend also speaks live in
 * @mappuzzle/shared; these are browser-side only, but both the game and the
 * editor render them, so they cannot sit in either app.
 */

import type { Puzzles, Regions } from "@mappuzzle/shared";

/** One language a Wikipedia article is available in. */
export interface WikiInfoLang {
  /** Article title in that language. */
  id: string;
  lang: string;
  langname: string;
  /** The language's name in itself, e.g. "Deutsch" for German. */
  autonym: string;
  rtl: boolean;
}

/** A puzzle row joined with the region grouping the selector displays. */
export interface PuzzleSearchResults extends Puzzles {
  region: Regions;
}

/** A piece's Wikipedia extract, ready to render. */
export interface WikiInfoPiece {
  title: string;
  contents: string[];
  image?: string;
  langs: WikiInfoLang[];
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
  autoClose?: number;
}
