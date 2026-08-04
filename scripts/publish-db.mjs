/**
 * Publishes the authoring database to the game.
 *
 * The editor writes apps/backend/db/backend.sqlite3.png; the game (and the PHP
 * gateway in production) reads data/front.sqlite3.png. This is the copy between
 * them, which used to be updateFrontDB.bat: a single `copy` line with paths
 * that only worked from the repo root, on Windows, with no checks.
 *
 *   node scripts/publish-db.mjs           compare and copy if they differ
 *   node scripts/publish-db.mjs --check   report only, exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const source = path.join(repoRoot, "apps/backend/db/backend.sqlite3.png");
const target = path.join(repoRoot, "data/front.sqlite3.png");
const checkOnly = process.argv.includes("--check");

const digest = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 12);

if (!fs.existsSync(source)) {
  console.error(`Authoring database not found: ${path.relative(repoRoot, source)}`);
  process.exit(1);
}

const from = digest(source);
const to = fs.existsSync(target) ? digest(target) : null;
const size = (file) => (fs.statSync(file).size / 1048576).toFixed(2) + " MB";

console.log(`authoring  ${path.relative(repoRoot, source)}  ${from}  ${size(source)}`);
console.log(
  `published  ${path.relative(repoRoot, target)}  ${to ?? "missing"}` +
    (to ? `  ${size(target)}` : "")
);

if (from === to) {
  console.log("\nAlready up to date.");
  process.exit(0);
}

if (checkOnly) {
  console.error("\nThe published database is out of date.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`\nPublished. The game now serves ${digest(target)}.`);
