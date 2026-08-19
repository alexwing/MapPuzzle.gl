/**
 * Everything the game client and the editor client both need.
 *
 * Data access (the SQL layer and its three drivers), the services on top of it,
 * the piece geometry, the shared UI and the pure helpers. Consumed as source
 * through a Vite alias, so there is no build step; only browser code lives here,
 * which is why the backend does not depend on this package.
 */

export * from "./types";

export { ConfigService } from "./services/configService";
export { PuzzleService } from "./services/puzzleService";
export {
  changeLanguage,
  getWikiImage,
  getWikiInfo,
} from "./services/wikiService";

export { query } from "./db/dbFactory";
export { securizeQuery, securizeTextParameter } from "./db/securize";

export { pieceBox, pieceSilhouette, pieceThumbnail } from "./geometry/pieceSilhouette";
export type { Silhouette } from "./geometry/pieceSilhouette";

export { useKeyPress } from "./hooks/useKeyPress";

export { default as AlertMessage } from "./ui/AlertMessage";
export { default as LoadingDialog } from "./ui/LoadingDialog";
export { default as PieceList } from "./ui/PieceList";

export * from "./lib/colors";
export * from "./lib/data";
export * from "./lib/lang";
export * from "./lib/pieces";
export * from "./lib/wiki";
