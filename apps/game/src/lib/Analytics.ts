/**
 * Analytics Event Tracking Service (MapPuzzle Analytics)
 * Sends structured custom events to the self-hosted cookieless collector.
 */

declare global {
  interface Window {
    mpAnalytics?: {
      track: (name: string, props?: Record<string, unknown>) => void;
      pageview: (url?: string) => void;
    };
  }
}

const SELF_ENDPOINT = "https://panel.mappuzzle.xyz/m/api/e";
const SELF_SITE = "mappuzzle";
const RE_SELF_EVENT = /^[a-z][a-z0-9_]{1,39}$/;
const RE_SELF_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function cleanSelfProps(params: Record<string, any> = {}): Record<string, string | number> | undefined {
  const out: Record<string, string | number> = {};
  let count = 0;
  for (const k of Object.keys(params)) {
    if (count >= 20 || !RE_SELF_KEY.test(k)) continue;
    const v = params[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
      count++;
    } else if (typeof v === "boolean") {
      out[k] = v ? 1 : 0;
      count++;
    } else if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed) {
        out[k] = trimmed.slice(0, 80);
        count++;
      }
    }
  }
  return count > 0 ? out : undefined;
}

function sendSelfEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || !RE_SELF_EVENT.test(eventName)) return;
  const loc = window.location;
  if (!loc || (loc.protocol !== "http:" && loc.protocol !== "https:") || LOCAL_HOSTS.has(loc.hostname)) {
    return;
  }
  try {
    const props = cleanSelfProps(params);
    if (typeof window.mpAnalytics?.track === "function") {
      window.mpAnalytics.track(eventName, props);
      return;
    }
    const lang = (navigator.language || "").slice(0, 2).toLowerCase() || undefined;
    const body = JSON.stringify({
      s: SELF_SITE,
      t: "ev",
      h: loc.host,
      u: loc.pathname || "/",
      n: eventName,
      ...(props ? { p: props } : {}),
      ...(lang ? { l: lang } : {}),
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function" && navigator.sendBeacon(SELF_ENDPOINT, body)) {
      return;
    }
    if (typeof fetch === "function") {
      fetch(SELF_ENDPOINT, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
        body,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never interrupt gameplay.
  }
}

/**
 * Generic analytics event dispatcher with safety checks (MapPuzzle Analytics)
 */
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  sendSelfEvent(eventName, params);
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

/**
 * Track the switch between the Mercator and Equal Earth projections
 */
export const trackToggleProjection = (options: {
  projection: "mercator" | "equalEarth";
  puzzleName?: string;
}) => {
  trackEvent("toggle_projection", {
    projection: options.projection === "equalEarth" ? "equal_earth" : "mercator",
    puzzle_name: options.puzzleName,
  });
};
