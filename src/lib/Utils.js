
export const colorScale = function (x) {
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
    [128, 0, 38]
  ];
  const i = Math.round(x * 7) + 4;
  if (x < 0) {
    return COLOR_SCALE[i] || COLOR_SCALE[0];
  }
  return COLOR_SCALE[i] || COLOR_SCALE[COLOR_SCALE.length - 1];
}


export const hexToRgb = function (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    [parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)]
    : null;
}


export const LightenDarkenColor = function (col, amt) {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  var r = col[0] * amt;
  var g = col[1] * amt;
  var b = col[2] * amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;


  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return [r, g, b];
}




export const setColor = function (col) {
  var colorArray = [
    '#fef400',
    '#67ba2e',
    '#eb891a',
    '#00913c',
    '#dc261b',
    '#00938d',
    '#815329',
    '#dc2053',
    '#005ca1',
    '#df127b',
    '#291670',
    '#811e78',
    '#ce9572',
    '#a3c828',
    
    '#fef400',
    '#67ba2e',
    '#eb891a',
    '#00913c',
    '#dc261b',
    '#00938d',
    '#815329',
    '#dc2053',
    '#005ca1',
    '#df127b',
    '#291670',
    '#811e78',
    '#ce9572',
    '#a3c828',];

  if (parseInt(col)< colorArray.length) {
    return colorArray[parseInt(col)];
  } else {
    do{
      col = (parseInt(col) - colorArray.length);
    }while (parseInt(col) > colorScale.length)
    return colorArray[Math.abs(col)];
  }


}


export const AlphaColor = function (col, alpha = 255) {
  if (col[0] === "#") {
    col = col.slice(1);
  }
  var r = col[0];
  var g = col[1];
  var b = col[2];

  if (r > 255) r = 255;
  else if (r < 0) r = 0;


  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  //console.log ( [r, g, b, alpha]);
  return [r, g, b, alpha];
}

export function ST_ExtentToVieport(box) {

  box = box.replace('BOX(', '').replace(')', '').replace(',', ' ');
  var arrayBox = box.split(' ');
  //return arrayBox[0]+' ' + arrayBox[1]+' ' +arrayBox[2]+' ' +arrayBox[3];
  return arrayBox[0] + ' ' + -(parseFloat(arrayBox[1]) + (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]))) + ' ' + (parseFloat(arrayBox[2]) - parseFloat(arrayBox[0])) + ' ' + (parseFloat(arrayBox[3]) - parseFloat(arrayBox[1]));
}

export function LazyRound(num) {
  var parts = num.split(".");
  return parts.length > 1 ? (Math.round(parseInt(parts.join(""), 10) / Math.pow(1000, parts.length - 1)) + ["T", "M", "B"][parts.length - 2]) : parts[0];
};


export async function Jsondb(filepath) {
  return fetch(
    filepath,
    {
      method: "GET",
      headers: new Headers({
        Accept: "application/json"
      })
    }
  )
    .then(res => res.json())
    .catch(error => console.log(error));
}


export async function Querydb(sql) {
  return fetch(
    'https://public.carto.com/api/v2/sql?q=' + sql,
    {
      method: "GET",
      headers: new Headers({
        Accept: "application/json"
      })
    }
  )
    .then(res => res.json())
    .catch(error => console.log(error));
}


export function secondsToTime(secs){
  let hours = Math.floor(secs / (60 * 60));

  let divisor_for_minutes = secs % (60 * 60);
  let minutes = Math.floor(divisor_for_minutes / 60);

  let divisor_for_seconds = divisor_for_minutes % 60;
  let seconds = Math.ceil(divisor_for_seconds);

  let obj = {
    "h": hours,
    "m": minutes,
    "s": seconds
  };
  return obj;
}