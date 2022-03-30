import GameTime from "../lib/GameTime";
import React from "react";
export const colorScale = function (x: any) {
  const COLOR_SCALE = [
    // negative
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],

    // positive
    [255, 255, 204],
    [255, 237, 160],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28],
    [189, 0, 38],
    [128, 0, 38],
  ];
  const i = Math.round(x * 7) + 4;
  if (x < 0) {
    return COLOR_SCALE[i] || COLOR_SCALE[0];
  }
  return COLOR_SCALE[i] || COLOR_SCALE[COLOR_SCALE.length - 1];
};

export const hexToRgb = function (hex: string | null): Array<number> {
  if (!hex) return [0, 0, 0];
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

export const LightenDarkenColor = function (col: string, amt: number) {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  var r = parseInt(col[0]) * amt;
  var g = parseInt(col[1]) * amt;
  var b = parseInt(col[2]) * amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return [r, g, b];
};

export const setColor = function (col: number): string {
  var colorArray = [
    "#fef400",
    "#67ba2e",
    "#eb891a",
    "#00913c",
    "#dc261b",
    "#00938d",
    "#815329",
    "#dc2053",
    "#005ca1",
    "#df127b",
    "#291670",
    "#811e78",
    "#ce9572",
    "#a3c828",

    "#fef400",
    "#67ba2e",
    "#eb891a",
    "#00913c",
    "#dc261b",
    "#00938d",
    "#815329",
    "#dc2053",
    "#005ca1",
    "#df127b",
    "#291670",
    "#811e78",
    "#ce9572",
    "#a3c828",
  ];

  if (col < colorArray.length) {
    return colorArray[col];
  } else {
    do {
      col = col - colorArray.length;
    } while (col > colorScale.length);
    return colorArray[Math.abs(col)];
  }
};

export const AlphaColor = function (col: any | string, alpha = 255) {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  let r: number = parseInt(col[0]);
  let g: number = parseInt(col[1]);
  let b: number = parseInt(col[2]);

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return [r, g, b, alpha];
};

export function ST_ExtentToVieport(box: string) {
  box = box.replace("BOX(", "").replace(")", "").replace(",", " ");
  var arrayBox = box.split(" ");
  return (
    arrayBox[0] +
    " " +
    -(
      parseFloat(arrayBox[1]) +
      (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]))
    ) +
    " " +
    (parseFloat(arrayBox[2]) - parseFloat(arrayBox[0])) +
    " " +
    (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]))
  );
}

export function LazyRound(num: string) {
  var parts = num.split(".");
  return parts.length > 1
    ? Math.round(
        parseInt(parts.join(""), 10) / Math.pow(1000, parts.length - 1)
      ) + ["T", "M", "B"][parts.length - 2]
    : parts[0];
}

export async function Jsondb(filepath: string) {
  return fetch(filepath, {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}

export async function Querydb(sql: string) {
  return fetch("https://public.carto.com/api/v2/sql?q=" + sql, {
    method: "GET",
    headers: new Headers({
      Accept: "application/json",
    }),
  })
    .then((res) => res.json())
    .catch((error) => console.log(error));
}

export function secondsToTime(secs: number) {
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

export function getTime() {
  var time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return (
      <span id="hours">
        {" "}
        <b>{time.h} </b>Hours <b>{time.m}</b> Minutes <b>{time.s}</b> Seconds
      </span>
    );
  } else if (time.m > 0) {
    return (
      <span id="minutes">
        <b>{time.m}</b> Minutes <b>{time.s}</b> Seconds
      </span>
    );
  } else if (time.s > 0) {
    return (
      <span id="seconds">
        <b>{time.s}</b> Seconds
      </span>
    );
  }
}

export function getTexTime() {
  var time = secondsToTime(GameTime.seconds);
  if (time.h > 0) {
    return (
      time.h + " hours and " + time.m + " minutes and " + time.s + " seconds"
    );
  } else if (time.m > 0) {
    return time.m + " minutes and " + time.s + " seconds";
  } else if (time.s > 0) {
    return time.s + " seconds";
  }
}

export function getUrl() {
  let url = window.location.href.split("/")[2];
  if (url.includes("localhost")) {
    return "mappuzzle.xyz";
  }
  return url;
}

export function cleanNameToWiki(wikiFind: any) {
  wikiFind = wikiFind.replace("(disputed)", "");
  if (wikiFind.includes(" - ")) {
    wikiFind = wikiFind.split(" - ")[0];
  }
  //replace - to space
  wikiFind = wikiFind.replace(/-/g, " ");
  //remove (Disputed)
  wikiFind = wikiFind.replace(/ /g, "_");
  return wikiFind;
}

