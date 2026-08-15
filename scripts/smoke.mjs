/**
 * Does the built app actually run?
 *
 * The typecheck passes on code that takes the whole app down on first render:
 * three times in one afternoon a change was clean by every static measure and
 * broken the moment a browser touched it — a helper that threw on an undefined
 * argument, image paths that resolved against the wrong directory, an address
 * shape that stopped selecting the flags quiz. None of it is catchable without
 * loading the page, so this loads the page.
 *
 * Assumes a server is already serving build/ at the given origin, and the Node
 * backend is answering, which is what the workflow arranges.
 *
 *   node scripts/smoke.mjs [origin]
 */
import { chromium } from "playwright";

const origin = process.argv[2] ?? "http://localhost:3000";

/** Each case: what to open, and what has to be true once it settles. */
const cases = [
  {
    url: "/",
    want: "the default map puzzle",
    check: (s) => s.pieces > 0 && /MapPuzzle\.xyz - /.test(s.title),
  },
  {
    url: "/map/croatia-counties/",
    want: "a map puzzle from its own address",
    check: (s) => s.pieces === 21 && /Croatia Counties/.test(s.title),
  },
  {
    url: "/?map=croatia_counties",
    want: "the older query address, rewritten to the canonical one",
    check: (s) => s.pieces === 21 && s.path === "/map/croatia-counties/",
  },
  {
    url: "/flag-quiz/spanish-provinces/",
    want: "the flags quiz from its own address",
    check: (s) => /FlagQuiz/.test(s.title),
  },
  {
    url: "/?flagQuiz",
    want: "the flags quiz with nothing after the parameter",
    check: (s) => /FlagQuiz/.test(s.title),
  },
];

/**
 * The picker's flags come out of the database as "flags/ES.png", relative, and
 * a page served from /map/<slug>/ resolves that inside its own directory. That
 * shipped: every flag in the picker was a broken image. Nothing above opens the
 * picker, so this does.
 */
async function checkPicker(browser, origin) {
  const page = await browser.newPage();
  const bad = [];
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  await page.goto(origin + "/map/croatia-counties/", { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(8_000);
  const opened = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((b) =>
      /Seleccionar Puzle|Select Puzzle/i.test(b.textContent + (b.getAttribute("title") ?? ""))
    );
    if (!button) return false;
    button.click();
    return true;
  });
  if (!opened) {
    await page.close();
    return "could not find the button that opens the picker";
  }
  await page.waitForTimeout(4_000);
  const flags = await page.evaluate(() => {
    const modal = document.querySelector('.modal.show, [role="dialog"]');
    const images = modal ? [...modal.querySelectorAll("img")] : [];
    return {
      total: images.length,
      broken: images.filter((i) => i.complete && i.naturalWidth === 0).length,
      sample: images[0]?.getAttribute("src") ?? null,
    };
  });
  await page.close();
  if (flags.total === 0) return "the picker opened with no flags in it";
  if (flags.broken > 0) return `${flags.broken} of ${flags.total} flags did not load (${flags.sample})`;
  if (bad.length) return `requests failed: ${[...new Set(bad)].join(", ")}`;
  console.log(`  ok    the puzzle picker -> ${flags.total} flags, none broken`);
  return null;
}

const browser = await chromium.launch();
const failures = [];

for (const one of cases) {
  const page = await browser.newPage();
  const errors = [];
  const missing = [];
  page.on("pageerror", (e) => errors.push(String(e.message).split("\n")[0]));
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });

  await page.goto(origin + one.url, { waitUntil: "load", timeout: 60_000 });

  // The map draws its pieces as SVG silhouettes whose viewBox is in metres, so
  // a big number there means the geometry arrived and rendered.
  const state = await page
    .waitForFunction(
      () => {
        const pieces = [...document.querySelectorAll("svg")].filter((s) => {
          const box = s.getAttribute("viewBox");
          return box && Math.abs(parseFloat(box.split(/\s+/)[2] || "0")) > 1000;
        }).length;
        const ready = pieces > 0 || /FlagQuiz/.test(document.title);
        return ready
          ? { pieces, title: document.title, path: location.pathname }
          : null;
      },
      null,
      { timeout: 45_000 }
    )
    .then((h) => h.jsonValue())
    .catch(() => null);

  const label = `${one.url}  (${one.want})`;
  if (!state) {
    failures.push(`${label}\n      nothing rendered within 45s`);
  } else if (!one.check(state)) {
    failures.push(`${label}\n      rendered, but wrong: ${JSON.stringify(state)}`);
  } else if (errors.length) {
    failures.push(`${label}\n      uncaught: ${errors.join(" | ")}`);
  } else if (missing.length) {
    failures.push(`${label}\n      requests failed: ${[...new Set(missing)].join(", ")}`);
  } else {
    console.log(`  ok    ${label} -> ${JSON.stringify(state)}`);
  }
  await page.close();
}

const pickerProblem = await checkPicker(browser, origin);
if (pickerProblem) failures.push(`the puzzle picker
      ${pickerProblem}`);

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} of ${cases.length} failed:\n`);
  for (const f of failures) console.error(`  FAIL  ${f}\n`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} checks passed.`);
