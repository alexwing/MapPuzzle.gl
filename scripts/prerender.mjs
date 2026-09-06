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


/**
 * The seven languages the interface speaks, and enough words to describe a
 * puzzle in each. The names themselves are not translated here: the interface
 * already carries all seventy in apps/game/src/i18n, and the regions come from
 * the 73,249 rows in custom_translations, which is the whole point of doing
 * this — the content exists, it just had no address.
 *
 * English keeps the phrasing it was indexed with. The rest use a separator
 * rather than an English-shaped noun pile, which does not survive translation.
 */
const LANGS = [
  {
    code: "en",
    title: (name, kind) => `${name} ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Interactive Geography Map Puzzles & Quizzes",
    homeHeading: "MapPuzzle: Interactive Geography Puzzles",
    homeDescription: "Explore the world through interactive map puzzles and flag quizzes. Reconstruct countries, provinces, and historical territories piece by piece in your browser. Free, educational, and no sign-up required.",
    exploreHeading: "Explore Map Puzzles",
    map: "map puzzle",
    quiz: "flag quiz",
    describeMap: (name, n, sample) =>
      `Put ${name} back together piece by piece: ${n} regions to place, including ${sample}. A free interactive map puzzle, no sign-up, playable in your browser.`,
    describeQuiz: (name, n, sample) =>
      `Guess the flag of every region in ${name}. ${n} flags to learn, including ${sample}. Free, no sign-up, playable in your browser.`,
    heading: (name, kind) => `${name} ${kind}`,
    regions: (n) => `The ${n} regions`,
    switchToMap: (name) => `Play the ${name} map puzzle`,
    switchToQuiz: (name) => `Play the ${name} flag quiz`,
  },
  {
    code: "es",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Puzles y mapas interactivos de geografía",
    homeHeading: "MapPuzzle: Puzles y mapas interactivos",
    homeDescription: "Aprende geografía jugando con puzles de mapas interactivos y desafíos de banderas. Recompón países, comunidades y territorios históricos pieza a pieza. Gratuito, educativo y sin registro.",
    exploreHeading: "Explora los puzles de mapas",
    map: "puzle de mapa",
    quiz: "quiz de banderas",
    describeMap: (name, n, sample) =>
      `Recompón ${name} pieza a pieza: ${n} regiones que colocar, entre ellas ${sample}. Un puzle de mapas gratuito, sin registro, para jugar en el navegador.`,
    describeQuiz: (name, n, sample) =>
      `Adivina la bandera de cada región de ${name}. ${n} banderas que aprender, entre ellas ${sample}. Gratis, sin registro, para jugar en el navegador.`,
    heading: (name, kind) => `${name}: ${kind}`,
    regions: (n) => `Las ${n} regiones`,
    switchToMap: (name) => `Jugar al puzle de mapa de ${name}`,
    switchToQuiz: (name) => `Jugar al quiz de banderas de ${name}`,
  },
  {
    code: "fr",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Puzzles cartographiques et géographie interactive",
    homeHeading: "MapPuzzle : Puzzles de cartes interactives",
    homeDescription: "Découvrez la géographie de manière ludique grâce à des puzzles de cartes interactifs et des quiz de drapeaux. Reconstituez pays, régions et territoires pièce par pièce. Gratuit et sans inscription.",
    exploreHeading: "Explorer les puzzles de cartes",
    map: "puzzle de carte",
    quiz: "quiz de drapeaux",
    describeMap: (name, n, sample) =>
      `Reconstituez ${name} pièce par pièce : ${n} régions à placer, dont ${sample}. Un puzzle de cartes gratuit, sans inscription, jouable dans le navegador.`,
    describeQuiz: (name, n, sample) =>
      `Devinez le drapeau de chaque région de ${name}. ${n} drapeaux à apprendre, dont ${sample}. Gratuit, sans inscription, jouable dans le navigateur.`,
    heading: (name, kind) => `${name} : ${kind}`,
    regions: (n) => `Les ${n} régions`,
    switchToMap: (name) => `Jouer au puzzle de carte de ${name}`,
    switchToQuiz: (name) => `Jouer au quiz de drapeaux de ${name}`,
  },
  {
    code: "pt",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Puzzles e mapas interativos de geografia",
    homeHeading: "MapPuzzle: Puzzles e mapas interativos",
    homeDescription: "Aprenda geografia jogando com puzzles de mapas interativos e desafios de bandeiras. Recomponha países, estados e territórios peça por peça no navegador. Gratuito e sem registo.",
    exploreHeading: "Explorar puzzles de mapas",
    map: "puzzle de mapa",
    quiz: "quiz de bandeiras",
    describeMap: (name, n, sample) =>
      `Recomponha ${name} peça a peça: ${n} regiões para colocar, entre elas ${sample}. Um puzzle de mapas gratuito, sem registo, para jogar no navegador.`,
    describeQuiz: (name, n, sample) =>
      `Adivinhe a bandeira de cada região de ${name}. ${n} bandeiras para aprender, entre elas ${sample}. Grátis, sem registo, para jogar no navegador.`,
    heading: (name, kind) => `${name}: ${kind}`,
    regions: (n) => `As ${n} regiões`,
    switchToMap: (name) => `Jogar o puzzle de mapa de ${name}`,
    switchToQuiz: (name) => `Jogar o quiz de bandeiras de ${name}`,
  },
  {
    code: "de",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Interaktive Geografie-Karten-Puzzles & Flaggen-Quiz",
    homeHeading: "MapPuzzle: Interaktive Karten-Puzzles",
    homeDescription: "Lerne Geografie spielerisch mit interaktiven Karten-Puzzles und Flaggen-Quizzen. Setze Länder, Bundesländer und historische Gebiete Stück für Stück im Browser zusammen. Kostenlos und ohne Registrierung.",
    exploreHeading: "Karten-Puzzles entdecken",
    map: "Karten-Puzzle",
    quiz: "Flaggen-Quiz",
    describeMap: (name, n, sample) =>
      `Setze ${name} Stück für Stück zusammen: ${n} Regionen zu platzieren, darunter ${sample}. Ein kostenloses Karten-Puzzle, ohne Anmeldung, im Browser spielbar.`,
    describeQuiz: (name, n, sample) =>
      `Errate die Flagge jeder Region in ${name}. ${n} Flaggen zum Lernen, darunter ${sample}. Kostenlos, ohne Anmeldung, im Browser spielbar.`,
    heading: (name, kind) => `${name}: ${kind}`,
    regions: (n) => `Die ${n} Regionen`,
    switchToMap: (name) => `Karten-Puzzle von ${name} spielen`,
    switchToQuiz: (name) => `Flaggen-Quiz von ${name} spielen`,
  },
  {
    code: "el",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Διαδραστικά παζλ γεωγραφίας και κουίζ σημαιών",
    homeHeading: "MapPuzzle: Διαδραστικά παζλ χαρτών",
    homeDescription: "Μάθετε γεωγραφία παίζοντας διαδραστικά παζλ χαρτών και κουίζ σημαιών. Συναρμολογήστε χώρες, επαρχίες και ιστορικά εδάφη κομμάτι κομμάτι στον περιηγητή. Δωρεάν και χωρίς εγγραφή.",
    exploreHeading: "Εξερευνήστε τα παζλ χαρτών",
    map: "παζλ χάρτη",
    quiz: "κουίζ σημαιών",
    describeMap: (name, n, sample) =>
      `Συναρμολόγησε ${name} κομμάτι κομμάτι: ${n} περιοχές για τοποθέτηση, όπως ${sample}. Ένα δωρεάν παζλ χαρτών, χωρίς εγγραφή, παίζεται στον περιηγητή.`,
    describeQuiz: (name, n, sample) =>
      `Μάντεψε τη σημαία κάθε περιοχής: ${name}. ${n} σημαίες για μάθηση, όπως ${sample}. Δωρεάν, χωρίς εγγραφή, παίζεται στον περιηγητή.`,
    heading: (name, kind) => `${name}: ${kind}`,
    regions: (n) => `Οι ${n} περιοχές`,
    switchToMap: (name) => `Παίξε το παζλ χάρτη: ${name}`,
    switchToQuiz: (name) => `Παίξε το κουίζ σημαιών: ${name}`,
  },
  {
    code: "it",
    title: (name, kind) => `${name} — ${kind} | MapPuzzle.xyz`,
    homeTitle: "MapPuzzle.xyz — Puzzle e quiz geografici interattivi",
    homeHeading: "MapPuzzle: Puzzle di mappe interattive",
    homeDescription: "Esplora la geografia giocando con puzzle di mappe interattive e quiz di bandiere. Ricomponi nazioni, regioni e territori pezzo per pezzo nel browser. Gratuito, educativo e senza registrazione.",
    exploreHeading: "Esplora i puzzle di mappe",
    map: "puzzle de mappa",
    quiz: "quiz di bandiere",
    describeMap: (name, n, sample) =>
      `Ricomponi ${name} pezzo per pezzo: ${n} regioni da posizionare, tra cui ${sample}. Un puzzle di mappe gratuito, senza registrazione, giocabile nel browser.`,
    describeQuiz: (name, n, sample) =>
      `Indovina la bandiera di ogni regione di ${name}. ${n} bandiere da imparare, tra cui ${sample}. Gratis, senza registrazione, giocabile nel browser.`,
    heading: (name, kind) => `${name}: ${kind}`,
    regions: (n) => `Le ${n} regioni`,
    switchToMap: (name) => `Gioca al puzzle di mappa di ${name}`,
    switchToQuiz: (name) => `Gioca al quiz di bandiere di ${name}`,
  },
];

const DEFAULT_LANG = "en";

/** Where a language's copy of a path lives; the default keeps the bare path. */
const localised = (path, lang) => (lang === DEFAULT_LANG ? path : `/${lang}${path}`);

/** The puzzle names the interface already carries, one file per language. */
function uiNames(lang) {
  const file = path.join(repoRoot, "apps/game/src/i18n", lang, "translation.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")).puzzles ?? {};
  } catch {
    return {};
  }
}

/** The region names, per language, out of the translations the editor imported. */
function regionNames(db, lang) {
  const rows = db
    .prepare("SELECT id, cartodb_id, translation FROM custom_translations WHERE lang = ?")
    .all(lang);
  const byPuzzle = new Map();
  for (const row of rows) {
    let one = byPuzzle.get(row.id);
    if (!one) {
      one = new Map();
      byPuzzle.set(row.id, one);
    }
    one.set(row.cartodb_id, unquote(String(row.translation)));
  }
  return byPuzzle;
}

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
  const empty = { names: [], ids: [] };
  if (!fs.existsSync(file)) return empty;
  try {
    const geo = JSON.parse(fs.readFileSync(file, "utf8"));
    const names = [];
    const ids = [];
    for (const feature of geo.features ?? []) {
      const name = feature?.properties?.name;
      if (typeof name !== "string" || !name.trim()) continue;
      names.push(name.trim());
      ids.push(feature?.properties?.cartodb_id);
    }
    return { names, ids };
  } catch (err) {
    console.warn(`  ${dataPath}: unreadable (${err.message})`);
    return empty;
  }
}

/**
 * One page, in one language.
 *
 * Everything a crawler reads is in the page's own language: the title, the
 * description, the heading and the region names. hreflang links the seven
 * copies to each other, and x-default points at English, so a search engine
 * knows they are one page in seven languages rather than seven pages competing.
 */
function page(template, puzzle, names, isQuiz, lang) {
  const bare = puzzlePath(puzzle.url, isQuiz);
  const url = SITE + localised(bare, lang.code);
  const kind = isQuiz ? lang.quiz : lang.map;
  const title = lang.title(puzzle.name, kind);
  const sample = names.slice(0, 8).join(", ");
  const description = isQuiz
    ? lang.describeQuiz(puzzle.name, names.length, sample)
    : lang.describeMap(puzzle.name, names.length, sample);

  let html = template;

  const meta = (kindOf, key, content) => {
    const pattern = new RegExp(`<meta\\s+${kindOf}="${key}"[\\s\\S]*?>`, "i");
    const tag = `<meta ${kindOf}="${key}" content="${escape(content)}" />`;
    if (!pattern.test(html)) throw new Error(`index.html has no ${kindOf}="${key}" to replace`);
    html = html.replace(pattern, tag);
  };

  html = html.replace(/<html lang="[^"]*"/i, `<html lang="${lang.code}"`);

  const title_re = /<title>[\s\S]*?<\/title>/;
  if (!title_re.test(html)) throw new Error("index.html has no <title> to replace");
  html = html.replace(title_re, `<title>${escape(title)}</title>`);

  /* The canonical is this language's own address, and every language points at
     every other. Without the alternates the copies read as duplicates of each
     other; with them they read as one page a reader can have in their own. */
  const alternates = LANGS.map(
    (other) =>
      `<link rel="alternate" hreflang="${other.code}" href="${SITE}${localised(bare, other.code)}" />`
  ).join("");
  const canonical_re = /<link\s+rel="canonical"[\s\S]*?>/i;
  if (!canonical_re.test(html)) throw new Error("index.html has no canonical link to replace");
  html = html.replace(
    canonical_re,
    `<link rel="canonical" href="${url}" />` +
      alternates +
      `<link rel="alternate" hreflang="x-default" href="${SITE}${bare}" />`
  );

  const card = `${SITE}/og${bare}`.replace(/\/$/, "") + ".png";
  const cardFile = path.join(
    dataDir,
    "og",
    isQuiz ? "flag-quiz" : "map",
    `${puzzle.url.replace(/_/g, "-")}.png`
  );
  if (fs.existsSync(cardFile)) {
    meta("property", "og:image", card);
    meta("name", "twitter:image", card);
    html = html.replace(
      /<meta property="og:image:alt"[\s\S]*?>/i,
      `<meta property="og:image:alt" content="${escape(title)}" />` +
        `<meta property="og:image:width" content="1200" />` +
        `<meta property="og:image:height" content="630" />`
    );
  }

  meta("name", "description", description);
  meta("property", "og:title", title);
  meta("property", "og:description", description);
  meta("property", "og:url", url);
  meta("property", "og:locale", lang.code);
  meta("name", "twitter:title", title);
  meta("name", "twitter:description", description);

  // Inside #root, so React clears it on mount: it is a loading state that says
  // what the page is, and it is what a crawler reads before running any script.
  const list = names.map((n) => `<li>${escape(n)}</li>`).join("");
  const crossPath = localised(puzzlePath(puzzle.url, !isQuiz), lang.code);
  const crossLink = isQuiz
    ? `<p style="margin: 1.5rem 0"><a href="${crossPath}" style="display:inline-block;padding:0.45rem 1rem;border-radius:8px;background:rgba(26,115,232,0.1);color:#1a73e8;text-decoration:none;font-weight:600">🗺️ ${escape(lang.switchToMap(puzzle.name))}</a></p>`
    : (puzzle.enableFlags
      ? `<p style="margin: 1.5rem 0"><a href="${crossPath}" style="display:inline-block;padding:0.45rem 1rem;border-radius:8px;background:rgba(26,115,232,0.1);color:#1a73e8;text-decoration:none;font-weight:600">🚩 ${escape(lang.switchToQuiz(puzzle.name))}</a></p>`
      : "");

  const placeholder =
    `<div id="root"><div class="prerendered-intro">` +
    `<h1>${escape(lang.heading(puzzle.name, kind))}</h1>` +
    `<p>${escape(description)}</p>` +
    crossLink +
    (names.length ? `<h2>${escape(lang.regions(names.length))}</h2><ul>${list}</ul>` : "") +
    `</div></div>`;
  html = html.replace(/<div id="root">\s*<\/div>/, placeholder);

  return html;
}

/**
 * The home page in each language.
 *
 * Gives crawlers real text, headings, description and internal links to every
 * puzzle so that home pages are never flagged as Soft 404.
 */
function homePage(template, puzzles, titlesByLang, lang) {
  const url = SITE + localised("/", lang.code);
  let html = template;

  const meta = (kindOf, key, content) => {
    const pattern = new RegExp(`<meta\\s+${kindOf}="${key}"[\\s\\S]*?>`, "i");
    const tag = `<meta ${kindOf}="${key}" content="${escape(content)}" />`;
    if (!pattern.test(html)) throw new Error(`index.html has no ${kindOf}="${key}" to replace`);
    html = html.replace(pattern, tag);
  };

  html = html.replace(/<html lang="[^"]*"/i, `<html lang="${lang.code}"`);

  const title_re = /<title>[\s\S]*?<\/title>/;
  if (!title_re.test(html)) throw new Error("index.html has no <title> to replace");
  html = html.replace(title_re, `<title>${escape(lang.homeTitle)}</title>`);

  const alternates = LANGS.map(
    (other) =>
      `<link rel="alternate" hreflang="${other.code}" href="${SITE}${localised("/", other.code)}" />`
  ).join("");
  const canonical_re = /<link\s+rel="canonical"[\s\S]*?>/i;
  if (!canonical_re.test(html)) throw new Error("index.html has no canonical link to replace");
  html = html.replace(
    canonical_re,
    `<link rel="canonical" href="${url}" />` +
      alternates +
      `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`
  );

  meta("name", "description", lang.homeDescription);
  meta("property", "og:title", lang.homeTitle);
  meta("property", "og:description", lang.homeDescription);
  meta("property", "og:url", url);
  meta("property", "og:locale", lang.code);
  meta("name", "twitter:title", lang.homeTitle);
  meta("name", "twitter:description", lang.homeDescription);

  const puzzleLinks = puzzles
    .map((p) => {
      const localName = unquote(String(titlesByLang.get(lang.code)?.[p.id] ?? p.name));
      const pPath = localised(puzzlePath(p.url, false), lang.code);
      return `<li><a href="${pPath}">${escape(localName)}</a></li>`;
    })
    .join("");

  const placeholder =
    `<div id="root"><div class="prerendered-intro">` +
    `<h1>${escape(lang.homeHeading)}</h1>` +
    `<p>${escape(lang.homeDescription)}</p>` +
    `<h2>${escape(lang.exploreHeading)}</h2><ul>${puzzleLinks}</ul>` +
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

/* The region names in each language, read once rather than per puzzle: the
   translations table is 73,249 rows and this walks it seven times, not 833. */
const db2 = new DatabaseSync(dbPath, { readOnly: true });
const namesByLang = new Map(LANGS.map((lang) => [lang.code, regionNames(db2, lang.code)]));
db2.close();
const titlesByLang = new Map(LANGS.map((lang) => [lang.code, uiNames(lang.code)]));

for (const puzzle of puzzles) {
  const original = piecesOf(puzzle.data);
  if (original.names.length === 0) noNames++;

  const targets = [false];
  if (puzzle.enableFlags) targets.push(true);

  for (const isQuiz of targets) {
    for (const lang of LANGS) {
      /* The puzzle's name as the interface says it in this language, and the
         regions as the editor imported them. Anything without a translation
         keeps the name the map carries, which is better than a gap. */
      const localName = unquote(String(titlesByLang.get(lang.code)?.[puzzle.id] ?? puzzle.name));
      const perPiece = namesByLang.get(lang.code)?.get(puzzle.id);
      const names = original.ids.map(
        (id, i) => perPiece?.get(id) ?? original.names[i]
      );

      const rel = localised(puzzlePath(puzzle.url, isQuiz), lang.code);
      written.push({ url: SITE + rel, lang: lang.code });
      if (checkOnly) continue;

      const dir = path.join(buildDir, rel);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "index.html"),
        page(template, { ...puzzle, name: localName }, names, isQuiz, lang)
      );
    }
  }
}

/* The home page in each language (including root '/' for English), so every
   entry point has real HTML content, meta tags, and puzzle links. */
if (!checkOnly) {
  for (const lang of LANGS) {
    const homeHtml = homePage(template, puzzles, titlesByLang, lang);
    if (lang.code === DEFAULT_LANG) {
      fs.writeFileSync(path.join(buildDir, "index.html"), homeHtml);
    } else {
      const dir = path.join(buildDir, lang.code);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), homeHtml);
    }
  }
}

/** The sitemap lists every page in every language, each as its own entry. */
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  LANGS.map(
    (lang) =>
      `  <url><loc>${SITE}${localised("/", lang.code)}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`
  ).join("\n") +
  "\n" +
  written
    .map(
      (w) =>
        `  <url><loc>${w.url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

const SITEMAP_NAMES = ["sitemap-index.xml", "sitemap.xml"];

if (!checkOnly) {
  for (const name of SITEMAP_NAMES) {
    fs.writeFileSync(path.join(buildDir, name), sitemap);
    fs.writeFileSync(path.join(dataDir, name), sitemap);
  }
}

const perLang = new Map();
for (const w of written) perLang.set(w.lang, (perLang.get(w.lang) ?? 0) + 1);
console.log(
  `${checkOnly ? "Would write" : "Wrote"} ${written.length} pages across ${LANGS.length} languages ` +
    `(${[...perLang.entries()].map(([l, n]) => `${l}:${n}`).join(", ")}), ` +
    `${written.length + LANGS.length} urls in the sitemap.`
);
if (noNames > 0) {
  console.warn(`${noNames} puzzles contributed no region names; their pages carry only the heading.`);
}
