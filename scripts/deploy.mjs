/**
 * Deploys the game to the PHP hosting over FTP.
 *
 * The build is 457 MB, but almost all of it is content that changes only when
 * the editor regenerates it: 395 MB of piece flags and 51 MB of map geometry.
 * The part that changes on a normal deploy is the 3.4 MB app shell. So the
 * default run always refreshes the shell and compares sizes before sending
 * anything from the bulk directories, and --only=app skips them entirely.
 *
 *   npm run deploy                 build, then upload what differs
 *   npm run deploy -- --dry-run    connect and print the plan, upload nothing
 *   npm run deploy -- --only=app   just the app shell, no asset comparison
 *   npm run deploy -- --all        re-upload everything, no comparison
 *   npm run deploy -- --no-build   deploy the existing build/ as it is
 *
 * Credentials come from .env.deploy or the environment, never from this file:
 * the repository is public. See .env.deploy.example.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const buildDir = path.join(repoRoot, "build");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const dryRun = has("--dry-run");
const uploadAll = has("--all");
const onlyApp = args.some((a) => a === "--only=app");
const skipBuild = has("--no-build") || has("--skip-build");
const verbose = has("--verbose");

/** Generated content: compared by size before sending. */
const BULK = ["maps", "flags", "customFlags", "flagQuiz", "doc", "og"];

/**
 * The app shell: everything in the build that is not bulk content. Small,
 * changes every deploy, always sent — front.sqlite3.png included, because the
 * PHP gateway reads it and it is only 2.4 MB.
 *
 * This was a fixed list of names, which silently dropped anything the build
 * started producing. A redesign added fonts/ and cursors/, neither was ever
 * uploaded, and the deploy still reported success: production fell back to
 * system fonts and the default cursor. Reading the build instead means a new
 * asset cannot be missed, and the workbox runtime that sw.js loads keeps
 * working when its content hash changes its filename.
 */
function shellNames() {
  return fs
    .readdirSync(buildDir)
    .filter((name) => !name.startsWith(".") && !BULK.includes(name));
}

/** Minimal .env reader: no expansion, splits on the first = only. */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const at = line.indexOf("=");
    if (at === -1) continue;
    const key = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...readEnvFile(path.join(repoRoot, ".env.deploy")), ...process.env };
const config = {
  host: env.FTP_HOST,
  user: env.FTP_USER,
  password: env.FTP_PASSWORD,
  secure: String(env.FTP_SECURE ?? "").toLowerCase() === "true",
  remoteDir: env.FTP_REMOTE_DIR || "/public_html",
};

for (const key of ["host", "user", "password"]) {
  if (!config[key]) {
    console.error(
      `Missing FTP_${key.toUpperCase()}. Copy .env.deploy.example to .env.deploy and fill it in.`
    );
    process.exit(1);
  }
}

const mb = (bytes) => (bytes / 1048576).toFixed(1) + " MB";

/** Every file under dir, as paths relative to build/. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(buildDir, full).split(path.sep).join("/"));
  }
  return out;
}

function collect(names) {
  const files = [];
  for (const name of names) {
    const full = path.join(buildDir, name);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(name);
  }
  return files;
}

/** Remote file sizes keyed by path relative to remoteDir. */
async function remoteSizes(client, dirs) {
  const sizes = new Map();
  const visit = async (relative) => {
    let listing;
    try {
      listing = await client.list(
        relative ? `${config.remoteDir}/${relative}` : config.remoteDir
      );
    } catch {
      return; // not there yet: everything under it counts as new
    }
    for (const item of listing) {
      const rel = relative ? `${relative}/${item.name}` : item.name;
      if (item.isDirectory) await visit(rel);
      else sizes.set(rel, item.size);
    }
  };
  for (const dir of dirs) await visit(dir);
  return sizes;
}

async function main() {
  if (!skipBuild) {
    if (dryRun) {
      console.log("Skipping the build in --dry-run.\n");
    } else {
      console.log("Building (npm run build)...");
      execFileSync("npm", ["run", "build"], {
        cwd: repoRoot,
        stdio: verbose ? "inherit" : "ignore",
        shell: process.platform === "win32",
      });
      console.log("Build done.\n");
    }
  }

  if (!fs.existsSync(buildDir)) {
    console.error("No build/ directory. Run without --no-build, or npm run build first.");
    process.exit(1);
  }

  const shell = collect(shellNames());
  const bulk = onlyApp ? [] : collect(BULK);

  const client = new Client(30_000);
  client.ftp.verbose = verbose;
  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      secure: config.secure,
    });
    console.log(`Connected to ${config.host} as ${config.user}`);
    console.log(`Landed in ${await client.pwd()}, deploying to ${config.remoteDir}\n`);

    let planned = shell.map((f) => ({ file: f, why: "shell" }));

    if (bulk.length > 0) {
      if (uploadAll) {
        planned.push(...bulk.map((f) => ({ file: f, why: "forced" })));
      } else {
        process.stdout.write(`Comparing ${bulk.length} generated files... `);
        const sizes = await remoteSizes(client, BULK);
        let same = 0;
        for (const file of bulk) {
          const local = fs.statSync(path.join(buildDir, file)).size;
          const remote = sizes.get(file);
          if (remote === local) same++;
          else planned.push({ file, why: remote === undefined ? "new" : "changed" });
        }
        console.log(`${same} already match, ${bulk.length - same} to send`);
      }
    }

    const bytes = planned.reduce(
      (sum, p) => sum + fs.statSync(path.join(buildDir, p.file)).size,
      0
    );
    const byReason = planned.reduce((acc, p) => {
      acc[p.why] = (acc[p.why] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `\n${planned.length} files, ${mb(bytes)} ` +
        `(${Object.entries(byReason).map(([k, v]) => `${v} ${k}`).join(", ")})`
    );

    if (dryRun) {
      console.log("\n--dry-run: nothing was uploaded. First 20 files:");
      for (const p of planned.slice(0, 20)) console.log(`  ${p.why.padEnd(8)} ${p.file}`);
      if (planned.length > 20) console.log(`  ... and ${planned.length - 20} more`);
      return;
    }

    // Grouped by directory: ensureDir both creates and enters, so doing it once
    // per directory instead of once per file saves thousands of round trips.
    // The order matters and is the safe one: the shell goes first, and the new
    // bundle renders correctly against both the old and the new map files,
    // whereas the old bundle needs the `poly` the new maps no longer carry.
    const byDir = new Map();
    for (const { file } of planned) {
      const dir = path.posix.dirname(file);
      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir).push(path.posix.basename(file));
    }

    let done = 0;
    let sent = 0;
    for (const [dir, names] of byDir) {
      const remoteDir =
        dir === "." ? config.remoteDir : `${config.remoteDir}/${dir}`;
      await client.ensureDir(remoteDir);
      for (const name of names) {
        const local = path.join(buildDir, dir === "." ? name : `${dir}/${name}`);
        await client.uploadFrom(local, name);
        sent += fs.statSync(local).size;
        done++;
        if (done % 10 === 0 || done === planned.length) {
          process.stdout.write(
            `\r  uploaded ${done}/${planned.length} (${mb(sent)})   `
          );
        }
      }
    }
    console.log(`\n\nDeployed ${done} files, ${mb(sent)}.`);
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error(`\nDeploy failed: ${err.message}`);
  process.exit(1);
});
