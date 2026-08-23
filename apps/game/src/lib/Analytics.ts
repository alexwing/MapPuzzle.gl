/**
 * Google Analytics 4 (GA4) Event Tracking Service
 * Sends structured custom events to Google Analytics.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Generic GA4 event dispatcher with safety checks
 */
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, params);
    } catch (e) {
      console.warn("GA4 event error:", e);
    }
  }
};

/**
 * Track when a puzzle/game starts or is loaded
 */
export const trackStartGame = (options: {
  puzzleId: number | string;
  puzzleName: string;
  gameMode?: "map" | "flag_quiz";
  lang?: string;
}) => {
  trackEvent("start_game", {
    puzzle_id: options.puzzleId,
    puzzle_name: options.puzzleName,
    game_mode: options.gameMode || "map",
    language: options.lang || (typeof document !== "undefined" ? document.documentElement.lang : "en"),
  });
};

/**
 * Track when a player wins/completes the puzzle
 */
export const trackWinGame = (options: {
  puzzleId?: number | string;
  puzzleName: string;
  gameMode?: "map" | "flag_quiz";
  timeSeconds: number;
  fails: number;
  founds: number;
  lang?: string;
}) => {
  trackEvent("win_game", {
    puzzle_id: options.puzzleId,
    puzzle_name: options.puzzleName,
    game_mode: options.gameMode || "map",
    time_seconds: options.timeSeconds,
    fails: options.fails,
    founds: options.founds,
    language: options.lang || (typeof document !== "undefined" ? document.documentElement.lang : "en"),
  });
};

/**
 * Track when a player restarts or surrenders
 */
export const trackResetGame = (options: {
  puzzleId?: number | string;
  puzzleName?: string;
  gameMode?: "map" | "flag_quiz";
  founds?: number;
  fails?: number;
}) => {
  trackEvent("reset_game", {
    puzzle_id: options.puzzleId,
    puzzle_name: options.puzzleName,
    game_mode: options.gameMode || "map",
    founds_before_reset: options.founds,
    fails_before_reset: options.fails,
  });
};

/**
 * Track when a user clicks a social share button
 */
export const trackShareScore = (options: {
  network: "whatsapp" | "twitter" | "facebook" | "telegram" | "linkedin" | "email" | string;
  puzzleName: string;
  gameMode?: "map" | "flag_quiz";
}) => {
  trackEvent("share", {
    method: options.network,
    content_type: "score",
    item_id: options.puzzleName,
    game_mode: options.gameMode || "map",
  });
};

/**
 * Track 2D / 3D map mode toggle
 */
export const trackToggle3D = (options: {
  is3d: boolean;
  puzzleName?: string;
}) => {
  trackEvent("toggle_3d_mode", {
    mode: options.is3d ? "3d" : "2d",
    puzzle_name: options.puzzleName,
  });
};

/**
 * Track selecting a puzzle from the puzzle selector table
 */
export const trackSelectPuzzle = (options: {
  puzzleId: number | string;
  puzzleName: string;
}) => {
  trackEvent("select_puzzle", {
    puzzle_id: options.puzzleId,
    puzzle_name: options.puzzleName,
  });
};
