import sqlite3 from "sqlite3";
/* eslint-disable import/no-mutable-exports */
import { Connection, ConnectionOptions, createConnection } from "typeorm";

import ActiveSession from "../models/activeSession";
import Puzzles from "../models/puzzles";
import Countries from "../models/countries";
import CustomCentroids from "../models/customCentroids";
import CustomWiki from "../models/customWiki";
import CustomTranslations from "../models/customTranslations";
import Languages from "../models/languages";

if (!process.env.SQLITE_PATH) {
  throw new Error("SQLITE_PATH environment variable is not set.");
}

const options: ConnectionOptions = {
  type: "sqlite",
  database: process.env.SQLITE_PATH,
  entities: [
    ActiveSession,
    Puzzles,
    Countries,
    CustomCentroids,
    CustomWiki,
    CustomTranslations,
    Languages
  ],
  logging: true,
};

export let connection: Connection | undefined;

export const connect = async (): Promise<Connection | undefined> => {
  try {
    const conn = await createConnection(options);
    connection = conn;
    console.log(
      `Database connection success. Connection name: '${conn.name}' Database: '${conn.options.database}'`
    );
  } catch (err) {
    console.log(err);
  }
  return undefined;
};

export const PrepareDB = () => new sqlite3.Database(":memory:");
