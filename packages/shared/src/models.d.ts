/**
 * Shape of the rows in the puzzles database.
 *
 * These used to be the TypeORM entity classes in the backend, imported by the
 * game and the editor as types. That made the browser depend on the backend's
 * source tree, and `puzzles.ts` importing `Regions` back from the frontend
 * closed a cycle between the two. They are plain interfaces here: the backend
 * entities implement them, so the schema and the contract stay together while
 * TypeORM and its decorators stay in the backend.
 *
 * Field names and types are deliberately unchanged, including the quirks:
 * `countryCode` is a number over a text column, and `id`/`cartodb_id` are both
 * declared as generated keys on three tables.
 */

/** Row of `view_state`. Not the react-map-gl ViewState, which is a view type. */
export interface ViewState {
  id: number;
  latitude: number;
  longitude: number;
  zoom: number;
  /** Set by the map library, never persisted. */
  transitionDuration?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transitionInterpolator?: any;
  bearing?: number;
  pitch?: number;
}

/** Row of `puzzles`, joined with its `view_state` and region when queried. */
export interface Puzzles {
  id: number;
  comment?: string;
  data: string;
  icon: string;
  name: string;
  url: string;
  wiki?: string;
  /** Resolved by hand from view_state, not a real column. */
  view_state?: ViewState | null;
  countryCode?: number;
  enableWiki?: boolean;
  enableFlags?: boolean;
}

/** Row of `countries`. */
export interface Countries {
  countrycode: number;
  name: string;
  alpha2: string;
  alpha3: string;
  iso3166_2: string;
  region: string;
  subRegion: string;
  intermediateRegion: string;
  regionCode: number;
  subRegionCode: number;
  intermediateRegionCode: number;
}

/** Row of `custom_centroids`: where the piece hangs from the drag cursor. */
export interface CustomCentroids {
  id: number;
  cartodb_id: number;
  left: number;
  top: number;
}

/** Row of `custom_wiki`: the Wikipedia article title for a piece. */
export interface CustomWiki {
  id: number;
  cartodb_id: number;
  wiki: string;
}

/** Row of `custom_translations`: a piece name in one language. */
export interface CustomTranslations {
  id: number;
  cartodb_id: number;
  lang: string;
  translation: string;
}

/** Row of `languages`. `active` and `rtl` are integers, not booleans. */
export interface Languages {
  lang: string;
  langname: string;
  autonym: string;
  active: number;
  rtl: number;
}
