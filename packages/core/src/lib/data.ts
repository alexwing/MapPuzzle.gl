/**
 * Fetching the static map JSON and normalising values coming out of SQLite.
 */

import { SqlValue } from "sql.js";

export async function Jsondb(filepath: string): Promise<any> {
  return fetch(filepath, {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}

/**
 * Converts a value to a number.
 * @param value - The value to convert.
 * @returns The converted number.
 */
export function convertToNumber(value: SqlValue): number {
  if (typeof value === "number") {
    return value;
  } else {
    if (value === null) {
      return 0;
    } else if (value === undefined) {
      return 0;
    } else if (value === "") {
      return 0;
    } else if (value === "null") {
      return 0;
    } else if (value === "undefined") {
      return 0;
    } else if (value === "NaN") {
      return 0;
    } else if (value === "nan") {
      return 0;
    } else if (value === "NAN") {
      return 0;
    } else if (value === "Nan") {
      //Uint8Array
    } else if (value instanceof Uint8Array) {
      return 0;
      //is has comma
    } else if (value.includes(",")) {
      return parseFloat(value.replace(",", "."));
    } else {
      return parseFloat(value);
    }
  }
  return 0;
}


/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param arr - The array to shuffle.
 * @returns An iterable iterator of the shuffled array.
 */
export function* shuffle<T>(arr: T[]): IterableIterator<T> {
  arr = [...arr];
  while (arr.length) yield arr.splice((Math.random() * arr.length) | 0, 1)[0];
}

/* clean url params */
