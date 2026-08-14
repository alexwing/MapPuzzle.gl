/**
 * Writes a real HTML page for every puzzle, and the sitemap that lists them.
 *
 * The app is one index.html that JavaScript fills in, so every puzzle URL used
 * to serve the same bytes: the same <title>MapPuzzle.xyz</title> for all of
 * them, and a body whose only text was "You need to enable JavaScript to run
 * this app." A crawler saw 119 identical pages competing with each other.
 *
 * So after the build this walks the published database and writes
 * build/map/<slug>/index.html and build/flag-quiz/<slug>/index.html, each with
 * its own title, description, canonical link and og tags, and with the names of
 * the regions as text inside #root. React replaces that when it mounts, so it
 * doubles as a loading state that says something instead of a blank screen.
 *
 * Real files rather than rewrite rules on purpose: the host answers 404 to any
 * path that is not a file and there is no .htaccess, so a file is the one thing
 * that is certain to work, on the CDN too.
 *
 *   node scripts/prerender.mjs            write the pages into build/
 *   node scripts/prerender.mjs --check    report what it would write
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const buildDir = path.join(repoRoot, "build");
const dataDir = path.join(repoRoot, "data");
const SITE = "https://mappuzzle.xyz";
const checkOnly = process.argv.includes("--check");

/** Mirrors puzzlePath() in apps/game/src/lib/Utils.tsx. Change both together. */
const puzzlePath = (slug, isQuiz) =>
  `/${isQuiz ? "flag-quiz" : "map"}/${slug.replace(/_/g, "-")}/`;

const escape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** SQLite text columns in this database arrive wrapped in literal quotes. */
const unquote = (s) => (typeof s === "string" ? s.replace(/^'|'$/g, "") : s);

/** The region names, which are the part of the page worth indexing. */
function piecesOf(dataPath) {
  const file = path.join(dataDir, dataPath);
  if (!fs.existsSync(file)) return [];
  try {
    const geo = JSON.parse(fs.readFileSync(file, "utf8"));
    return (geo.features ?? [])
      .map((f) => f?.properties?.name)
      .filter((n) => typeof n === "string" && n.trim())
      .map((n) => n.trim());
  } catch (err) {
    console.warn(`  ${dataPath}: unreadable (${err.message})`);
    return [];
  }
}

function describe(puzzle, names, isQuiz) {
  const sample = names.slice(0, 8).join(", ");
  return isQuiz
    ? `Guess the flag of every region in ${puzzle.name}. ${names.length} flags to learn, including ${sample}. Free, no sign-up, playable in your browser.`
    : `Put ${puzzle.name} back together piece by piece: ${names.length} regions to place, including ${sample}. A free interactive map puzzle, no sign-up, playable in your browser.`;
}

function page(template, puzzle, names, isQuiz) {
  const url = SITE + puzzlePath(puzzle.url, isQuiz);
  const title = isQuiz
    ? `${puzzle.name} flag quiz | MapPuzzle.xyz`
    : `${puzzle.name} map puzzle | MapPuzzle.xyz`;
  const description = describe(puzzle, names, isQuiz);

  let html = template;

  /**
   * Replaces a meta tag by its name or property. Tolerant of newlines inside
   * the tag, because index.html is written by hand and the description is
   * spread over three lines there; a pattern expecting single spaces missed it
   * and every page shipped the generic description.
   */
  const meta = (kind, key, content) => {
    const pattern = new RegExp(`<meta\\s+${kind}="${key}"[\\s\\S]*?>`, "i");
    const tag = `<meta ${kind}="${key}" content="${escape(content)}" />`;
    if (!pattern.test(html)) throw new Error(`index.html has no ${kind}="${key}" to replace`);
    html = html.replace(pattern, tag);
  };

  const title_re = /<title>[\s\S]*?<\/title>/;
  if (!title_re.test(html)) throw new Error("index.html has no <title> to replace");
  html = html.replace(title_re, `<title>${escape(title)}</title>`);

  const canonical_re = /<link\s+rel="canonical"[\s\S]*?>/i;
  if (!canonical_re.test(html)) throw new Error("index.html has no canonical link to replace");
  html = html.replace(canonical_re, `<link rel="canonical" href="${url}" />`);

  meta("name", "description", description);
  meta("property", "og:title", title);
  meta("property", "og:description", description);
  meta("property", "og:url", url);
  meta("name", "twitter:title", title);
  meta("name", "twitter:description", description);

  // Inside #root, so React clears it on mount: it is a loading state that says
  // what the page is, and it is what a crawler reads before running any script.
  const heading = isQuiz
    ? `${escape(puzzle.name)} flag quiz`
    : `${escape(puzzle.name)} map puzzle`;
  const list = names.map((n) => `<li>${escape(n)}</li>`).join("");
  const placeholder =
    `<div id="root"><div class="prerendered-intro">` +
    `<h1>${heading}</h1>` +
    `<p>${escape(describe(puzzle, names, isQuiz))}</p>` +
    (names.length ? `<h2>The ${names.length} regions</h2><ul>${list}</ul>` : "") +
    `</div></div>`;
  html = html.replace(/<div id="root">\s*<\/div>/, placeholder);

  return html;
}

const dbPath = path.join(dataDir, "front.sqlite3.png");
const templatePath = path.join(buildDir, "index.html");
for (const [what, file] of [["build", templatePath], ["database", dbPath]]) {
  if (!fs.existsSync(file)) {
    console.error(`No ${what} at ${path.relative(repoRoot, file)}. Run the build first.`);
    process.exit(1);
  }
}

const template = fs.readFileSync(templatePath, "utf8");
const db = new DatabaseSync(dbPath, { readOnly: true });
const puzzles = db
  .prepare("SELECT id, name, url, data, enableFlags FROM puzzles ORDER BY name")
  .all()
  .map((p) => ({
    id: p.id,
    name: unquote(p.name),
    url: unquote(p.url),
    data: unquote(p.data),
    enableFlags: Number(p.enableFlags) === 1,
  }));
db.close();

const written = [];
let noNames = 0;

for (const puzzle of puzzles) {
  const names = piecesOf(puzzle.data);
  if (names.length === 0) noNames++;

  const targets = [[false, puzzle]];
  if (puzzle.enableFlags) targets.push([true, puzzle]);

  for (const [isQuiz] of targets) {
    const rel = puzzlePath(puzzle.url, isQuiz);
    written.push({ url: SITE + rel, pieces: names.length });
    if (checkOnly) continue;
    const dir = path.join(buildDir, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), page(template, puzzle, names, isQuiz));
  }
}

/** The sitemap lists the canonical pages, the ones just written. */
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n` +
  written
    .map(
      (w) =>
        `  <url><loc>${w.url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

if (!checkOnly) {
  fs.writeFileSync(path.join(buildDir, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(dataDir, "sitemap.xml"), sitemap);
}

const maps = written.filter((w) => w.url.includes("/map/")).length;
console.log(
  `${checkOnly ? "Would write" : "Wrote"} ${written.length} pages: ` +
    `${maps} maps, ${written.length - maps} flag quizzes, ` +
    `${written.length + 1} urls in the sitemap.`
);
if (noNames > 0) {
  console.warn(`${noNames} puzzles contributed no region names; their pages carry only the heading.`);
}
