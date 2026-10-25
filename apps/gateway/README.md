# @mappuzzle/gateway

Sustituto en Node del `apps/game/public/backendPHP/index.php`: pasarela de solo lectura
sobre `front.sqlite3.png`. Mismo contrato (`POST /` con `{"query": "SELECT ..."}` → array JSON),
sin dependencias (usa `node:sqlite`, Node ≥ 22.13).

Compatibilidad con el PHP: orígenes CORS, `Vary: Origin`, preflight 204, una sola sentencia,
solo `SELECT`, 2000 caracteres, 100 000 filas, `readOnly` + `PRAGMA query_only`, y los
strings numéricos salen como números (`JSON_NUMERIC_CHECK`). Añade: timeout de consulta
(504; mata el proceso), consultas en procesos hijo (se matan con SIGKILL al vencer el timeout; un worker thread no puede interrumpir SQLite), límite de
cuerpo de 16 KB y `GET /healthz`.

## Despliegue en el VPS

```bash
cd apps/gateway
pm2 start ecosystem.config.cjs   # ajustar DATABASE_FILE
pm2 save
```

Luego añadir el bloque de `nginx.conf.example` y `nginx -t && systemctl reload nginx`.
El cliente (`VITE_BACKEND_URL=https://mappuzzle.xyz/backendPHP`) no cambia.

Variables: `PORT` (3100), `HOST` (127.0.0.1), `DATABASE_FILE`, `ALLOWED_ORIGINS` (lista
separada por comas), `WORKERS` (2), `QUERY_TIMEOUT_MS` (10000).

Tests: `npm test`.

## Opción B (evolución)

El cliente interpola ids y `url` en el SQL (`puzzleService.ts`). Mejor retirar el SQL del
cliente: endpoints con nombre (`GET /puzzles/:url`, `/languages`, `/translations/:lang`…) con
sentencias preparadas en el servidor, o JSON precalculados en `prerender`/`publish-db`
servidos como estáticos por NGINX con `Cache-Control` largo. Cuando el cliente deje de usar
`query`, el gateway puede quedarse solo con esos endpoints.
