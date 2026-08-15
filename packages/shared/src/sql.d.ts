/**
 * The shape of a query result.
 *
 * These names come from sql.js, which the game used to load in the browser to
 * read the SQLite file directly. That mode is gone — the PHP gateway answers in
 * production and the Node backend does locally — but both of them answer in this
 * same shape, so the types outlived the library. Declared here rather than kept
 * as a dependency on sql.js for two type aliases.
 */

/** A single cell. Blobs arrive as bytes; a NULL column is null. */
export type SqlValue = string | number | Uint8Array | null;

/** One result set: the column names, and a row per array of values. */
export interface QueryExecResult {
  columns: string[];
  values: SqlValue[][];
}
