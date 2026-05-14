// One-off: convert existing fat-schema JSON files in flight-data-repo
// into the slim-v1 schema in place. Run after pulling flight-data-repo
// locally, then commit the result.
//
// Usage:
//   node ./migrate.js <path-to-flight-data-repo>
// Example:
//   node ./migrate.js ../flight-data-repo
//
// The script:
//   1. Globs <repo>/data/flight/*.json
//   2. Skips files already tagged `schema: "slim-v1"` (idempotent)
//   3. Rewrites each remaining file with slimmed states + no pretty-print
//   4. Reports per-file before/after sizes and a totals line

import fs from "fs";
import path from "path";
import { slimResponse, SLIM_SCHEMA_VERSION } from "./services/slim.js";

const repoArg = process.argv[2];
if (!repoArg) {
  console.error("Usage: node migrate.js <path-to-flight-data-repo>");
  process.exit(1);
}

const dataDir = path.resolve(repoArg, "data/flight");
if (!fs.existsSync(dataDir)) {
  console.error(`Data dir not found: ${dataDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

console.log(`📁 Found ${files.length} files in ${dataDir}\n`);

let migrated = 0;
let alreadySlim = 0;
let failed = 0;
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  try {
    const beforeSize = fs.statSync(filePath).size;
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (data?.schema === SLIM_SCHEMA_VERSION) {
      alreadySlim++;
      totalBefore += beforeSize;
      totalAfter += beforeSize;
      continue;
    }

    const slim = slimResponse(data);
    fs.writeFileSync(filePath, JSON.stringify(slim), "utf-8");
    const afterSize = fs.statSync(filePath).size;

    totalBefore += beforeSize;
    totalAfter += afterSize;
    migrated++;

    const reduction = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);
    console.log(
      `✅ ${file}: ${(beforeSize / 1024).toFixed(0)} KB → ${(afterSize / 1024).toFixed(0)} KB (-${reduction}%)`,
    );
  } catch (err) {
    failed++;
    console.error(`❌ ${file}: ${err.message}`);
  }
}

const reduction =
  totalBefore > 0
    ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)
    : "0.0";

console.log("\n────────── summary ──────────");
console.log(`migrated:     ${migrated}`);
console.log(`already slim: ${alreadySlim}`);
console.log(`failed:       ${failed}`);
console.log(
  `size:  ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB (-${reduction}%)`,
);
