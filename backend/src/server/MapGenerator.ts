import { Pool, ClientConfig } from "pg";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export class MapGenerator {
  private clientConfig: ClientConfig;

  private pool: Pool;
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

  public async getMap(
    table: string,
    name: string,
    id: string,
    mapcolor: string,
    fileJson: string
  ): Promise<any> {
    const client = await this.pool.connect();
    try {
      //generate query qgis
      let query = ` SELECT jsonb_build_object(
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
                                            initcap([name]) as name ,
                                            ST_AsSVG(ST_Translate(ST_Transform(ST_SetSRID(geom,4326),3857),-ST_Xmin(ST_Transform(ST_SetSRID(geom,4326),3857)),-ST_YMax(ST_Transform(ST_SetSRID(geom,4326),3857)))) as poly,
                                            CONCAT('0 0 ', ST_Distance(CONCAT('SRID=3857;POINT(', ST_XMin(ST_Transform(ST_SetSRID(geom,4326), 3857)), ' 0)')::geometry, CONCAT('SRID=3857;POINT(', ST_XMax(ST_Transform(ST_SetSRID(geom,4326), 3857)), ' 0)')::geometry), ' ', ST_Distance(CONCAT('SRID=3857;POINT(0 ', ST_YMin(ST_Transform(ST_SetSRID(geom,4326), 3857)), ')')::geometry, CONCAT('SRID=3857;POINT(0 ', ST_YMax(ST_Transform(ST_SetSRID(geom,4326), 3857)), ')')::geometry)) as box,
                                            [mapcolor] as mapcolor,
                                            ST_Envelope(geom) as extend
                                        from
                                            public.[table] sb 
                                        order by
                                            name 
                            )
                            row) features;`;

      //replace table name, id and name, mapcolor
      query = query.replace("[table]", table);
      query = query.replace("[id]", id);
      query = query.replace("[name]", name);
      query = query.replace("[mapcolor]", mapcolor);

      //execute query
      const res = await client.query(query);

      //copy geojson to E:\projects\MapPuzzle.gl\public
      fs.writeFile(
        "E:\\projects\\MapPuzzle.gl\\public\\" + fileJson + ".geojson",
        res.rows[0].jsonb_build_object,
        // @ts-ignore
        function (err) {
          if (err) {
            return console.log(err);
          }
          console.log("The file was saved!");
        }
      );

      return res.rows[0].jsonb_build_object;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  //get all tables
  public async getTables(): Promise<any> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      return res.rows;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  //get all columns from table
  public async getColumns(table: string): Promise<any> {
    const client = await this.pool.connect();
    let sql = `SELECT column_name FROM information_schema.columns WHERE table_name = '[table]'`;
    sql = sql.replace("[table]", table);
    try {
      const res = await client.query(sql);
      return res.rows;
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
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
      path.join(__dirname, `../../../temp/` + table + `.sql`)
    );

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        // return;
      }
      console.log(`stdout: ${stdout}`);

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
        path.join(__dirname, `../../../temp/` + table + `.sql`)
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
        const tempDir = path.join(__dirname, `../../../temp`);
        fs.rmdirSync(tempDir, { recursive: true });
      });
    });
  }
}
