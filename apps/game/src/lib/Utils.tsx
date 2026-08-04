/**
 * Helpers that only the game needs: time, cookies, the map view state and the
 * translation lookups. Everything the editor also uses moved to
 * @mappuzzle/core; re-exported here so the game's existing imports keep working.
 */
export {
  AlphaColor,
  className,
  cleanWikiComment,
  colorScale,
  colorStroke,
  convertToNumber,
  getCurrentLang,
  getLang,
  getTitleFromLang,
  getWiki,
  getWikiSimple,
  hexToRgb,
  Jsondb,
  langName,
  languagesToWikiInfoLang,
  LightenDarkenColor,
  lineWidth,
  setColor,
  sortLangs,
} from "@mappuzzle/core";

import GameTime from "../lib/GameTime";
import React from "react";
import { ViewState } from "react-map-gl";
import type { CustomWiki } from "@mappuzzle/shared";
import { PieceProps, WikiInfoLang } from "../models/Interfaces";
import { getCookie } from "react-simple-cookie-store";
import type { Languages } from "@mappuzzle/shared";
import { ConfigService } from "@mappuzzle/core";
import { TFunction } from "i18next";
import { SqlValue } from "sql.js";
import i18n from 'i18next';







/**
 * Converts a number of seconds to an object representing the equivalent time in hours, minutes, and seconds.
 * @param secs - The number of seconds to convert.
 * @returns An object representing the equivalent time in hours, minutes, and seconds.
 */
export function secondsToTime(secs: number): {
  h: number;
  m: number;
  s: number;
} {
  const hours = Math.floor(secs / (60 * 60));

  const divisor_for_minutes = secs % (60 * 60);
  const minutes = Math.floor(divisor_for_minutes / 60);

  const divisor_for_seconds = divisor_for_minutes % 60;
  const seconds = Math.ceil(divisor_for_seconds);
  return {
    h: hours,
    m: minutes,
    s: seconds,
  };
}

/**
 * Returns a JSX element representing the time in a formatted way, based on the number of seconds passed.
 * If the time is greater than an hour, it returns the time in hours, minutes, and seconds.
 * If the time is greater than a minute, it returns the time in minutes and seconds.
 * If the time is less than a minute, it returns the time in seconds.
 * @param t - The translation function to use for formatting the time.
 * @returns A JSX element representing the time in a formatted way.
 */
export function getTime(t: TFunction): JSX.Element | undefined {
  const time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return (
      <span id="hours">
        {t("common.time.hours", {
          hours: time.h,
          minutes: time.m,
          seconds: time.s,
        })}
      </span>
    );
  } else if (time.m > 0) {
    return (
      <span id="minutes">
        {t("common.time.minutes", { minutes: time.m, seconds: time.s })}
      </span>
    );
  } else if (time.s > 0) {
    return (
      <span id="seconds">{t("common.time.seconds", { seconds: time.s })}</span>
    );
  }
}

/**
 * Returns a string representing the time in a formatted way, based on the number of seconds passed.
 * If the time is greater than an hour, it returns the time in hours, minutes, and seconds.
 * If the time is greater than a minute, it returns the time in minutes and seconds.
 * If the time is less than a minute, it returns the time in seconds.
 * @param t - The translation function to use for formatting the time.
 * @returns A string representing the time in a formatted way.
 */
export function getTexTime(t: TFunction): string | undefined {
  const time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return t("common.time.hours", {
      hours: time.h,
      minutes: time.m,
      seconds: time.s,
    });
  } else if (time.m > 0) {
    return t("common.time.minutes", { minutes: time.m, seconds: time.s });
  } else if (time.s > 0) {
    return t("common.time.seconds", { seconds: time.s });
  }
}

/**
 * Returns the current URL of the page, excluding the protocol and path.
 * If the URL includes "localhost", it returns "mappuzzle.xyz".
 * @returns The current URL of the page.
 */
export function getUrl(): string {
  const url = window.location.href.split("/")[2];
  if (url.includes("localhost")) {
    return "mappuzzle.xyz";
  }
  return url;
}




/**
 * Copies the view state from one object to another, preserving the bearing and pitch of the destination view state.
 * @param viewStateOrigin - The view state object to copy from.
 * @param viewStateDestination - The view state object to copy to.
 * @returns The updated view state object.
 */
export function copyViewState(
  viewStateOrigin: ViewState,
  viewStateDestination: ViewState
): ViewState {
  if (!viewStateDestination) {
    viewStateDestination = {
      latitude: parseFloat(viewStateOrigin.latitude.toString()),
      longitude: parseFloat(viewStateOrigin.longitude.toString()),
      zoom: parseFloat(viewStateOrigin.zoom.toString()),
      bearing: 0,
      pitch: 0,
    };
  } else {
    viewStateDestination = {
      latitude: parseFloat(viewStateOrigin.latitude.toString()),
      longitude: parseFloat(viewStateOrigin.longitude.toString()),
      zoom: parseFloat(viewStateOrigin.zoom.toString()),
      bearing: viewStateDestination.bearing,
      pitch: viewStateDestination.pitch,
    };
  }
  return viewStateDestination;
}







/**
 * Yields the elements of an array in random order, without mutating it.
 * @param arr - The array to shuffle.
 */
export function* shuffle<T>(arr: T[]): IterableIterator<T> {
  arr = [...arr];
  while (arr.length) yield arr.splice((Math.random() * arr.length) | 0, 1)[0];
}

export function cleanUrlParams(url: string): string {
  const index = url.indexOf("&");
  if (index > -1) {
    return url.substring(0, index);
  } else {
    return url;
  }
}

/**
 * Calculates the zoom level based on the given bounding box and viewport dimensions.
 * @param bbox - The bounding box of the map.
 * @returns The calculated zoom level.
 */
export function calculateZoom(bbox: number[]): number {
  const viewportWidth = window.innerWidth;
  /** The height of the viewport. */
  const viewportHeight = window.innerHeight;
  const [west, south, east, north] = bbox;
  const viewportSize = Math.min(viewportWidth, viewportHeight);
  const lngDiff = east - west;
  const latDiff = north - south;
  const lngZoom = Math.log2(((360 / 512) * viewportSize) / lngDiff);
  const latZoom = Math.log2(((180 / 512) * viewportSize) / latDiff);
  const zoom = Math.min(lngZoom, latZoom);

  return Math.round(zoom);
}


/**
 * Calculates distance proportion from ecuador based on the given latitude.
 * @param bbox - The bounding box of the map.
 * @returns The calculated distance porcentage from ecuador. 
 */
export function calculateDistanceFromEcuador(lat: number): number {
  return Math.abs(lat) / 100;
}


/**
 * Returns the translation for a given code and parent.
 * @param parent - The parent of the translation.
 * @param code - The code of the translation.
 * @param noTranslation - The default translation if the code is not found.
 * @returns The translation as a string.
 */
export function getTranslation(parent, code: string, noTranslation?: string) {
  let translation = "";
  
  if (code) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const possibleTranslation =  i18n.t(parent + '.' + code);
    if (typeof possibleTranslation === "string" && possibleTranslation !== parent + '.' + code ) {
      translation = possibleTranslation;
    }
  }
  if (noTranslation && translation === "") {
    translation = noTranslation;
  }
  return translation;
}