import fs from "fs";
import path from "path";
import * as shapefile from "shapefile";
import type { MapGeneratorModel } from "@mappuzzle/shared";
import ViewState from "../models/viewState";
import { ensureDir, mapsDir, shapefilesDir } from "../config/paths";

/**
 * Turns a shapefile into the GeoJSON the game loads.
 *
 * This replaces the PostGIS round trip. Maps used to be created by shelling out
 * to shp2pgsql.exe to load the shapefile into PostgreSQL and then querying it
 * back out with ST_AsGeoJSON, which meant a database, two Windows-only binaries
 * and six PG* settings for what is really two operations: read the file, and
 * find the centre of its extent. Once the piece silhouettes moved to the
 * browser, nothing else in the query needed PostGIS at all.
 *
 * Coordinates are assumed to be WGS84. That is not new: shp2pgsql ran with
 * `-s 4326`, which declares the SRID without reprojecting, so a shapefile in
 * another CRS was already silently wrong. Now it is checked and reported.
 */

/** A field of the .dbf, with what it holds, so the editor can offer it. */
export interface ShapefileField {
  name: string;
  /** True when every value read is a safe integer: only those suit cartodb_id. */
  numeric: boolean;
  /** First value, to show as an example. */
  sample: string;
}

const COORDINATE_DECIMALS = 6; // ~10 cm, well past what a puzzle piece needs

function layerPath(layer: string): string {
  // Guard against a layer name escaping the directory.
  const file = path.join(shapefilesDir(), `${path.basename(layer)}.shp`);
  if (!file.startsWith(shapefilesDir())) {
    throw new Error(`Invalid layer name: ${layer}`);
  }
  return file;
}

/**
 * Title-cases a name only if it arrived shouting.
 *
 * The old query ran everything through PostGIS initcap(), which lowercases and
 * then capitalises each word. That fixes "ALBERTA" but damages names that were
 * already correct: "Al Hudud ash Shamaliyah" would come back as "... Ash ...".
 */
function tidyName(value: string): string {
  const text = value.trim();
  if (/[a-zà-ÿ]/.test(text)) return text;
  return text
    .toLocaleLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_m, before, letter) => before + letter.toLocaleUpperCase());
}

function round(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roundCoordinates(coordinates: any): any {
  if (typeof coordinates[0] === "number") {
    return [round(coordinates[0]), round(coordinates[1])];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (coordinates as any[]).map(roundCoordinates);
}

export class ShapefileImporter {
  /** The .shp files available to import, by bare name. */
  public listLayers(): string[] {
    const dir = shapefilesDir();
    if (!fs.existsSync(dir)) return [""];
    const layers = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".shp"))
      .map((f) => f.slice(0, -4))
      .sort();
    // Leading blank so the editor's select starts unset, as with PostGIS tables.
    return ["", ...layers];
  }

  /** Field names of a layer's .dbf, read without touching the geometry. */
  public async listFields(layer: string): Promise<ShapefileField[]> {
    if (!layer) return [];
    const dbf = layerPath(layer).replace(/\.shp$/i, ".dbf");
    if (!fs.existsSync(dbf)) throw new Error(`No .dbf next to ${layer}.shp`);

    const source = await shapefile.openDbf(dbf, {
      encoding: this.encodingOf(layer),
    });
    const seen = new Map<string, { numeric: boolean; sample: string }>();
    for (let r = await source.read(); !r.done; r = await source.read()) {
      for (const [name, value] of Object.entries(r.value as object)) {
        const isInteger = typeof value === "number" && Number.isSafeInteger(value);
        const previous = seen.get(name);
        if (!previous) {
          seen.set(name, { numeric: isInteger, sample: String(value ?? "") });
        } else if (!isInteger) {
          previous.numeric = false;
        }
      }
    }
    return [...seen.entries()].map(([name, meta]) => ({ name, ...meta }));
  }

  /**
   * Writes <maps>/<fileJson>.geojson and returns the view state to centre on.
   *
   * `id` and `mapColor` may be left empty: GADM, for instance, has no numeric
   * key and no colour column, so both fall back to the piece's position. The
   * game only needs them to be distinct small integers.
   */
  public async generateJson(data: MapGeneratorModel): Promise<ViewState> {
    const shp = layerPath(data.table);
    if (!fs.existsSync(shp)) throw new Error(`${data.table}.shp not found`);
    this.checkProjection(data.table);

    const source = await shapefile.open(shp, shp.replace(/\.shp$/i, ".dbf"), {
      encoding: this.encodingOf(data.table),
    });

    const features = [];
    for (let r = await source.read(); !r.done; r = await source.read()) {
      const geometry = r.value.geometry;
      // A puzzle piece is an area. Anything else (points, lines, or a
      // collection) would load but leave nothing to click on, so say so here
      // rather than produce a map that silently does not work.
      if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
        throw new Error(
          `${data.table}.shp contains ${geometry.type}, and puzzle pieces have ` +
            `to be Polygon or MultiPolygon.`
        );
      }
      const properties = r.value.properties as Record<string, unknown>;
      const rawName = data.name ? properties[data.name] : undefined;
      features.push({
        type: "Feature",
        geometry: {
          type: geometry.type,
          coordinates: roundCoordinates(geometry.coordinates),
        },
        properties: {
          cartodb_id: 0, // assigned below, once sorted
          name: tidyName(String(rawName ?? "")),
          mapcolor: 0,
        },
        // Kept out of the output, only used to honour a chosen id/colour field.
        source: properties,
      });
    }

    // The old query ordered by name, and the piece list still relies on it.
    features.sort((a, b) => a.properties.name.localeCompare(b.properties.name));

    features.forEach((feature, index) => {
      const chosenId = data.id ? feature.source[data.id] : undefined;
      const chosenColor = data.mapColor ? feature.source[data.mapColor] : undefined;
      feature.properties.cartodb_id = Number.isSafeInteger(chosenId)
        ? (chosenId as number)
        : index + 1;
      feature.properties.mapcolor = Number.isSafeInteger(chosenColor)
        ? (chosenColor as number)
        : index + 1;
      delete (feature as { source?: unknown }).source;
    });

    const geojsonPath = path.join(mapsDir(), `${data.fileJson}.geojson`);
    ensureDir(mapsDir());
    fs.writeFileSync(
      geojsonPath,
      JSON.stringify({ type: "FeatureCollection", features })
    );
    console.log(
      `Wrote ${geojsonPath}: ${features.length} pieces from ${data.table}.shp`
    );

    return this.centreOf(source.bbox);
  }

  /** Centre of the layer's extent, as ST_Centroid(ST_Extent(geom)) gave. */
  private centreOf(bbox: number[] | undefined): ViewState {
    const view = new ViewState();
    if (!bbox || bbox.length < 4) {
      view.latitude = 0;
      view.longitude = 0;
      view.zoom = 5;
      return view;
    }
    const [minX, minY, maxX, maxY] = bbox;
    view.longitude = (minX + maxX) / 2;
    view.latitude = (minY + maxY) / 2;
    view.zoom = 5;
    return view;
  }

  /** The .cpg sidecar names the .dbf's code page; GADM ships UTF-8. */
  private encodingOf(layer: string): string {
    const cpg = layerPath(layer).replace(/\.shp$/i, ".cpg");
    if (!fs.existsSync(cpg)) return "utf8";
    const declared = fs.readFileSync(cpg, "utf8").trim().toLowerCase();
    if (declared.includes("utf")) return "utf8";
    if (declared.includes("1252") || declared.includes("latin")) return "latin1";
    return declared || "utf8";
  }

  /** Warns when the .prj is not WGS84: the coordinates are used as degrees. */
  private checkProjection(layer: string): void {
    const prj = layerPath(layer).replace(/\.shp$/i, ".prj");
    if (!fs.existsSync(prj)) return;
    const wkt = fs.readFileSync(prj, "utf8");
    const looksWgs84 = /WGS[_ ]?1984|WGS84|EPSG.{0,4}4326/i.test(wkt);
    if (!looksWgs84) {
      console.warn(
        `${layer}.prj does not look like WGS84, and coordinates are read as ` +
          `degrees without reprojecting, so the map will come out distorted:\n` +
          wkt.slice(0, 200)
      );
    }
  }
}
