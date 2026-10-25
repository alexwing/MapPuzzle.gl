// Child process: owns one read-only connection and runs one SELECT at a time.
// node:sqlite is synchronous and cannot be interrupted from JS, so queries run in
// a separate process that the pool can SIGKILL when a query exceeds its timeout.
import { DatabaseSync } from 'node:sqlite';

const { GATEWAY_DB_FILE: dbFile, GATEWAY_BUSY_TIMEOUT_MS: busyTimeoutMs } = process.env;

const db = new DatabaseSync(dbFile, { readOnly: true });
db.exec(`PRAGMA busy_timeout = ${Number(busyTimeoutMs) | 0}`);
db.exec('PRAGMA query_only = 1');

// Same output as PHP's JSON_NUMERIC_CHECK: numeric-looking strings become numbers.
const NUMERIC = /^[ \t\n\r\v\f]*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[ \t\n\r\v\f]*$/;

function replacer(_key, value) {
  if (typeof value === 'string' && NUMERIC.test(value)) return Number(value);
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  return value;
}

process.on('message', ({ id, sql, maxRows }) => {
  try {
    const rows = [];
    for (const row of db.prepare(sql).iterate()) {
      rows.push(row);
      if (rows.length >= maxRows) break;
    }
    process.send({ id, json: JSON.stringify(rows, replacer) });
  } catch (error) {
    process.send({ id, error: String(error?.message ?? error) });
  }
});

process.send({ ready: true });
