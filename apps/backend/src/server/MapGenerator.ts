import { Pool, ClientConfig, PoolClient } from "pg";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import type { MapGeneratorModel } from "@mappuzzle/shared";
import ViewState from "../models/viewState";
import { TEMP_DIR, ensureDir, mapsDir } from "../config/paths";


/**
 * A readable reason from a connection failure. pg rejects with an AggregateError
 * whose own message is empty, hiding the one detail that matters: it holds one
 * error per address it tried, typically ECONNREFUSED for ::1 and for 127.0.0.1.
 */
function describe(e: unknown): string {
  const inner = (e as { errors?: unknown[] })?.errors;
  if (Array.isArray(inner) && inner.length > 0) {
    const seen = new Set(
      inner.map((x) => (x as Error)?.message ?? String(x)).filter(Boolean)
    );
    if (seen.size > 0) return `(${[...seen].join("; ")})`;
  }
  const message = e instanceof Error ? e.message : String(e);
  return message ? `(${message})` : "";
}

export class MapGenerator {
  private clientConfig: ClientConfig;

  private pool: Pool;

  /**
   * Borrows a pooled client, runs the work, and always releases it.
   *
   * connect() used to sit outside the try in all five callers, so with
   * PostgreSQL down its rejection was unhandled and took the whole API process
   * with it: opening the editor's New Map tab, which lists the PostGIS tables,
   * was enough to kill port 5000. The callers also swallowed query errors and
   * returned undefined, which the routes reported as success.
   */
  private async withClient<T>(
    run: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch (e) {
      const where = `${process.env.PGHOST}:${process.env.PGPORT}`;
      throw new Error(
        `Cannot reach PostgreSQL at ${where}. Creating maps needs PostgreSQL ` +
          `with PostGIS running; everything else in the editor works without ` +
          `it. ${describe(e)}`
      );
    }
    try {
      return await run(client);
    } finally {
      client.release();
    }
  }

  constructor() {
    this.clientConfig = {
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      // @ts-ignore
      port: parseInt(process.env.PGPORT),
    };
    this.pool = new Pool(this.clientConfig);
  }

  public async generateJson(data: MapGeneratorModel): Promise<ViewState> {
    await this.withClient(async (client) => {
      // The features carry geometry and metadata only. The piece silhouettes
      // used to be baked in here as `poly` (ST_AsSVG) plus a `box` viewBox,
      // which duplicated the geometry the client already loads for deck.gl and
      // made up 56% of public/maps; src/lib/pieceSilhouette derives both in the
      // browser now. `extend` (ST_Envelope) was never read by anything.
      let query = `SELECT jsonb_build_object(
                                'type',     'FeatureCollection',
                                'features', jsonb_agg(feature)
                            )
                            FROM (
                            SELECT jsonb_build_object(
                                'type',       'Feature',
                                'geometry',   ST_AsGeoJSON(geom)::jsonb,
                                'properties', to_jsonb(row) - 'geom'
                            ) AS feature
                            FROM (
                                        select
                                            [id] as cartodb_id,
                                            geom,
                                            initcap([name]) as name,
                                            [mapcolor] as mapcolor
                                        from
                                            public.[table] sb
                                        order by
                                            name
                            )
                            row) features;`;

      //replace table name, id and name, mapcolor
      query = query.replace("[table]", data.table);
      query = query.replace("[id]", data.id);
      query = query.replace("[name]", data.name);
      query = query.replace("[mapcolor]", data.mapColor);

      //log console query qgis
      console.log("query qgis: " + query);
      //execute query
      const res = await client.query(query);

      const geojsonPath = path.join(mapsDir(), `${data.fileJson}.geojson`);
      ensureDir(mapsDir());
      if (fs.existsSync(geojsonPath)) {
        fs.unlinkSync(geojsonPath);
      }

      // Written synchronously: the callback used to return a ViewState that
      // nothing received, and the route replied before the file existed.
      fs.writeFileSync(
        geojsonPath,
        // @ts-ignore
        JSON.stringify(res.rows[0].jsonb_build_object)
      );
      console.log(`Wrote ${geojsonPath}`);
    });
    return this.calcCenter(data.table);
  }
  private async calcCenter(table: string): Promise<ViewState> {
    return this.withClient(async (client) => {
      let sql = `SELECT ST_X(ST_Centroid(ST_Extent(geom))) as lon, ST_Y(ST_Centroid(ST_Extent(geom))) as lat FROM public.[table]`;
      sql = sql.replace("[table]", table);
      const res = await client.query(sql);
      const center: ViewState = new ViewState();
      center.latitude = res.rows[0].lat;
      center.longitude = res.rows[0].lon;
      center.zoom = 5;
      return center;
    });
  }

      









  //get all tables
  public async getTables(): Promise<string[]> {
    return this.withClient(async (client) => {
      const res = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const tables = res.rows.map((row) => row.table_name);
      //add empty table first
      tables.unshift("");
      return tables;
    });
  }

  //get all columns from table
  public async getColumns(table: string): Promise<string[]> {
    return this.withClient(async (client) => {
      let sql = `SELECT column_name FROM information_schema.columns WHERE table_name = '[table]'`;
      sql = sql.replace("[table]", table);
      const res = await client.query(sql);
      const columns = res.rows.map((row) => row.column_name);
      //add empty column first
      columns.unshift("");
      return columns;
    });
  }

  //drop table if exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async dropTable(table: string): Promise<any> {
    return this.withClient((client) =>
      client.query(`DROP TABLE IF EXISTS public.${table}`)
    );
  }

    

  //run  shp2pgsql.exe for import shapefile from folder
  public async importShapefile(shapeFile: string, table: string): Promise<any> {
    // let command = `"C:\\Program Files\\PostgreSQL\\9.6\\bin\\shp2pgsql.exe" -s 4326 -I -W "latin1" -g geom -c -D -a -t 2D [shapefile] public.[table] | psql -h [host] -p [port] -U [user] -d [database] -P [password]`;
    //in utf8
    let command = `"[PGPATH]shp2pgsql.exe" -s 4326  -I [shapefile] > [sqlfile]`;
    // @ts-ignore
    command = command.replace("[PGPATH]", process.env.PGPATH);
    //replace table name
    command = command.replace("[shapefile]", shapeFile);
    //to temp folder
    command = command.replace(
      "[sqlfile]",
      path.join(TEMP_DIR, table + ".sql")
    );

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      //drop table if exist
      await this.dropTable(shapeFile);


      //run sql
      let commandSql = `"[PGPATH]psql.exe" -h [host] -p [port] -U [user] -d [database]  -f [sqlfile]`;
      // @ts-ignore
      commandSql = commandSql.replace("[PGPATH]", process.env.PGPATH);
      // @ts-ignore
      commandSql = commandSql.replace("[host]", process.env.PGHOST);
      // @ts-ignore
      commandSql = commandSql.replace("[port]", process.env.PGPORT);
      // @ts-ignore
      commandSql = commandSql.replace("[user]", process.env.PGUSER);
      // @ts-ignore
      commandSql = commandSql.replace("[database]", process.env.PGDATABASE);
      // @ts-ignore
      commandSql = commandSql.replace("[password]", process.env.PGPASSWORD);
      // @ts-ignore
      //to tempDir folder with table name .sql
      commandSql = commandSql.replace(
        "[sqlfile]",
        path.join(TEMP_DIR, table + ".sql")
      );

      exec(commandSql, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        //delete temp folder
        fs.rmdirSync(TEMP_DIR, { recursive: true });
      });
    });
  }
}
