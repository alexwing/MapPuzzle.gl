/**
 * Colour helpers for the map, the piece list and the drag cursor.
 * Pure: no imports on purpose, so both clients can use them freely.
 */

export const colorStroke = [150, 150, 150];

export const lineWidth = 1;

/**
 * Returns an array of RGB values representing a color on a scale from negative to positive.
 * @param x - The value to determine the color for.
 * @returns An array of three numbers representing the red, green, and blue values of the resulting color.
 */
export function colorScale(x: number): number[] {
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
}

export const hexToRgb = function (hex: string | null): Array<number> {
  if (!hex) return [0, 0, 0];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

/**
 * Lightens or darkens a given color by a specified amount.
 * @param col - The color to lighten or darken, in hexadecimal format.
 * @param amt - The amount to lighten or darken the color by, as a number between -1 and 1.
 * @returns An array of three numbers representing the red, green, and blue values of the resulting color.
 */
export function LightenDarkenColor(col: string, amt: number): Array<number> {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  let r = parseInt(col[0]) * amt;
  let g = parseInt(col[1]) * amt;
  let b = parseInt(col[2]) * amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return [r, g, b];
}

/**
 * Sets the color of a given number as a string.
 * @param col - The number to set the color for.
 * @returns The color as a string.
 */
export function setColor(col: number): string {
  const colorArray = [
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
    "#7a7a7a",
    "#b5b5b5",
    "#93a42a",
    "#d7a94a",
    "#6fa2e3",
    "#c28dc7",
    "#8ec5a9",
    "#f0c27a",
    "#95d1c4",
    "#f5e0b7",    
    "#3e4a66",
    "#aa6f73",
    "#4a9068",
    "#d692ae",
    "#507dbc",
    "#ab83a1",
    "#6d9dc5",
    "#c0b283",
    "#b06e79",
    "#6c876d",
  ];

  if (col < colorArray.length) {
    return colorArray[col];
  } else {
    do {
      col = col - colorArray.length;
    } while (col > colorScale.length);
    return colorArray[Math.abs(col)];
  }
}

/**
 * Converts a hex color code to an RGBA color array with the specified alpha value.
 * @param col - The hex color code to convert.
 * @param alpha - The alpha value to use for the RGBA color array. Defaults to 255.
 * @returns An RGBA color array with the specified alpha value.
 */
export function AlphaColor({
  col,
  alpha = 255,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  col: any | string;
  alpha?: number;
}): Array<number> {
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
}

/**
 * Fetches a JSON file from the specified filepath and returns its contents as a Promise.
 * @param filepath - The path to the JSON file to fetch.
 * @returns A Promise that resolves to the contents of the fetched JSON file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
