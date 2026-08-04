<?php

/**
 * Read-only JSON gateway over the puzzles SQLite database.
 *
 * The client (src/lib/db/dbPHPBackend.tsx) posts {"query": "SELECT ..."} and
 * gets the rows back. Writes are impossible by construction, in three
 * independent layers, so no single mistake re-opens the door:
 *   1. the connection is opened read-only where the platform supports it,
 *   2. PRAGMA query_only rejects every write inside the engine itself,
 *   3. only one statement is accepted, and it has to start with SELECT.
 *
 * Serving arbitrary SQL is still not a good shape for a public endpoint; the
 * plan is to replace it with per-operation queries or with JSON generated at
 * build time. Until then, this at least cannot be used to modify the database.
 */

declare(strict_types=1);

// Never print internals to the client: shared hosting often has display_errors on.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Every hostname the game is served from. game.mappuzzle.xyz shares this
 * document root, and VITE_BACKEND_URL points every host at mappuzzle.xyz, so
 * requests from it are cross-origin and it has to be listed: leaving it out
 * breaks that hostname, which the previous `*` header happened to allow.
 */
const ALLOWED_ORIGINS = [
    'https://mappuzzle.xyz',
    'https://www.mappuzzle.xyz',
    'https://game.mappuzzle.xyz',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
const DATABASE_FILE = '/../front.sqlite3.png';
const MAX_QUERY_LENGTH = 2000;
const MAX_ROWS = 100000;
/** SQLite lock wait, not a limit on how long a SELECT may run. */
const BUSY_TIMEOUT_SECONDS = 5;

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Compress the response when the hosting has not been configured to do it.
if (
    !ini_get('zlib.output_compression')
    && strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false
) {
    ini_set('zlib.output_compression', '1');
}

/** Ends the request with a status code and a message that leaks nothing. */
function fail(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') {
    // Every query is a POST with a JSON body, so each one is preflighted;
    // caching the preflight halves the round trips.
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}
if ($method !== 'POST') {
    fail(405, 'Method not allowed');
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body) || !isset($body['query']) || !is_string($body['query'])) {
    fail(400, 'A JSON body with a string "query" is required');
}

$sql = rtrim(trim($body['query']), "; \t\n\r");
if ($sql === '' || strlen($sql) > MAX_QUERY_LENGTH) {
    fail(400, 'Empty or oversized query');
}
if (strpos($sql, ';') !== false) {
    fail(400, 'Only a single statement is allowed');
}
// Checking the leading keyword, rather than blacklisting words anywhere in the
// string, is both stricter and free of false positives: a legitimate
// `LIKE '%update%'` used to be rejected as an injection attempt.
if (preg_match('/^SELECT\s/i', $sql) !== 1) {
    fail(400, 'Only SELECT statements are allowed');
}

try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => BUSY_TIMEOUT_SECONDS,
    ];
    // A genuinely read-only handle, available from PHP 8.1. On older versions
    // the PRAGMA below is what keeps the database safe.
    if (defined('PDO::SQLITE_ATTR_OPEN_FLAGS') && defined('PDO::SQLITE_OPEN_READONLY')) {
        $options[PDO::SQLITE_ATTR_OPEN_FLAGS] = PDO::SQLITE_OPEN_READONLY;
    }
    $pdo = new PDO('sqlite:' . __DIR__ . DATABASE_FILE, null, null, $options);
    $pdo->exec('PRAGMA query_only = 1');
} catch (Throwable $e) {
    error_log('mappuzzle: cannot open database: ' . $e->getMessage());
    fail(500, 'Database unavailable');
}

try {
    $statement = $pdo->prepare($sql);
    $statement->execute();
    // Fetched row by row so a runaway join cannot exhaust memory before a
    // count() on the full result set would have had the chance to notice.
    $rows = [];
    while (count($rows) < MAX_ROWS && ($row = $statement->fetch()) !== false) {
        $rows[] = $row;
    }
} catch (Throwable $e) {
    error_log('mappuzzle: query failed: ' . $e->getMessage() . ' -- ' . $sql);
    fail(400, 'Query failed');
}

// JSON_NUMERIC_CHECK is kept for compatibility: PDO returns every SQLite column
// as a string, while the client mappers expect numbers.
echo json_encode($rows, JSON_NUMERIC_CHECK);
