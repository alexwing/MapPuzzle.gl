// Read-only SQL gateway over front.sqlite3.png. Drop-in replacement for
// apps/game/public/backendPHP/index.php: same request, validation and response.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryError, QueryTimeoutError, WorkerPool } from './pool.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_ORIGINS = [
  'https://mappuzzle.xyz',
  'https://www.mappuzzle.xyz',
  'https://game.mappuzzle.xyz',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT ?? 3100),
    host: env.HOST ?? '127.0.0.1',
    dbFile: path.resolve(env.DATABASE_FILE ?? path.join(here, '../../data/front.sqlite3.png')),
    allowedOrigins: env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : DEFAULT_ORIGINS,
    maxQueryLength: 2000,
    maxRows: 100000,
    maxBodyBytes: 16 * 1024,
    busyTimeoutMs: 5000,
    queryTimeoutMs: Number(env.QUERY_TIMEOUT_MS ?? 10000),
    workers: Number(env.WORKERS ?? 2),
  };
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(400, 'Empty or oversized query'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function validate(rawBody, config) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }
  if (!body || typeof body !== 'object' || typeof body.query !== 'string') {
    throw new HttpError(400, 'A JSON body with a string "query" is required');
  }
  const sql = body.query.trim().replace(/[; \t\n\r]+$/, '');
  if (sql === '' || sql.length > config.maxQueryLength) throw new HttpError(400, 'Empty or oversized query');
  if (sql.includes(';')) throw new HttpError(400, 'Only a single statement is allowed');
  if (!/^SELECT\s/i.test(sql)) throw new HttpError(400, 'Only SELECT statements are allowed');
  return sql;
}

export function createServer(config = loadConfig()) {
  const pool = new WorkerPool({
    size: config.workers,
    workerFile: path.join(here, 'query-worker.mjs'),
    dbFile: config.dbFile,
    busyTimeoutMs: config.busyTimeoutMs,
  });

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin ?? '';
    if (config.allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const send = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(payload);
    };
    const fail = (status, message) => send(status, JSON.stringify({ error: message }));

    try {
      const { pathname } = new URL(req.url ?? '/', 'http://gateway');
      if (req.method === 'GET' && pathname === '/healthz') return send(200, '{"ok":true}');
      if (pathname !== '/') return fail(404, 'Not found');
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Max-Age', '86400');
        res.writeHead(204);
        return res.end();
      }
      if (req.method !== 'POST') return fail(405, 'Method not allowed');

      const sql = validate(await readBody(req, config.maxBodyBytes), config);
      try {
        send(200, await pool.run(sql, { maxRows: config.maxRows, timeoutMs: config.queryTimeoutMs }));
      } catch (error) {
        if (error instanceof QueryTimeoutError) throw new HttpError(504, 'Query timed out');
        if (error instanceof QueryError) {
          console.error(`mappuzzle: query failed: ${error.message} -- ${sql}`);
          throw new HttpError(400, 'Query failed');
        }
        console.error(`mappuzzle: database unavailable: ${error.message}`);
        throw new HttpError(500, 'Database unavailable');
      }
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error instanceof HttpError) return fail(error.status, error.message);
      console.error('mappuzzle: unexpected error', error);
      fail(500, 'Internal error');
    }
  });

  server.requestTimeout = 30000;
  server.on('close', () => pool.close());
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const server = createServer(config);
  server.listen(config.port, config.host, () => {
    console.log(`mappuzzle gateway on http://${config.host}:${config.port} -> ${config.dbFile}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
