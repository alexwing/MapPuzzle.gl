import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createServer, loadConfig } from './server.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gateway-'));
const dbFile = path.join(dir, 'test.sqlite3.png');
let server;
let base;

before(async () => {
  const db = new DatabaseSync(dbFile);
  db.exec(`CREATE TABLE t (id INTEGER, name TEXT, code TEXT, ratio REAL);
    INSERT INTO t VALUES (1,'Spain','42',1.5),(2,'France','007',NULL),(3,'Chad','x1',2.0);`);
  db.close();
  server = createServer({ ...loadConfig({}), dbFile, workers: 1, queryTimeoutMs: 1000 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
});

after(async () => {
  const closed = new Promise((r) => server.close(r));
  server.closeAllConnections();
  await closed;
  await new Promise((r) => setTimeout(r, 200));
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
});

const post = (body, headers = {}) =>
  fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('SELECT returns rows with numeric strings as numbers (JSON_NUMERIC_CHECK)', async () => {
  const res = await post({ query: 'SELECT * FROM t ORDER BY id;' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [
    { id: 1, name: 'Spain', code: 42, ratio: 1.5 },
    { id: 2, name: 'France', code: 7, ratio: null },
    { id: 3, name: 'Chad', code: 'x1', ratio: 2 },
  ]);
});

test('rejects non-SELECT, multiple statements, bad bodies', async () => {
  for (const [body, status] of [
    [{ query: 'DELETE FROM t' }, 400],
    [{ query: 'SELECT 1; DROP TABLE t' }, 400],
    [{ query: '   ' }, 400],
    [{ query: 'SELECT ' + 'x'.repeat(2000) }, 400],
    [{ query: 5 }, 400],
    ['not json', 400],
    [{ query: 'SELECT * FROM missing' }, 400],
  ]) {
    const res = await post(body);
    assert.equal(res.status, status, JSON.stringify(body).slice(0, 40));
    assert.ok((await res.json()).error);
  }
});

test('methods, CORS and preflight', async () => {
  assert.equal((await fetch(base)).status, 405);
  const pre = await fetch(base, { method: 'OPTIONS', headers: { Origin: 'https://mappuzzle.xyz' } });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), 'https://mappuzzle.xyz');
  const bad = await post({ query: 'SELECT 1' }, { Origin: 'https://evil.example' });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  assert.equal(bad.headers.get('vary'), 'Origin');
});

test('runaway query is killed and the pool recovers', async () => {
  const slow = 'SELECT count(*) FROM (WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c) SELECT x FROM c)';
  const res = await post({ query: slow });
  assert.equal(res.status, 504);
  const ok = await post({ query: 'SELECT count(*) AS n FROM t' });
  assert.deepEqual(await ok.json(), [{ n: 3 }]);
});
