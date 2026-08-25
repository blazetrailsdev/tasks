// Tests for the pure helpers in lib.mjs. Standalone runner, no framework:
// collect failures and throw at the end so an uncaught exception sets a
// non-zero exit code. No node:* imports, no process.* references — the same
// purity constraints validate-lib.test.mjs holds to.
import { extractStoryPaths } from "./lib.mjs";

const failures = [];
function test(name, fn) {
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}\n  expected: ${e}\n  actual:   ${a}`);
}

test("extracts a backticked path from a Context bullet", () => {
  const body = "## Context\n\n- `packages/activerecord/src/relation.ts` is the seat.\n";
  assertEqual(extractStoryPaths(body), ["packages/activerecord/src/relation.ts"], "one path");
});

test("strips a trailing :line citation", () => {
  const body = "See scripts/cli.ts:1523 and scripts/lib.mjs:50.\n";
  assertEqual(extractStoryPaths(body), ["scripts/cli.ts", "scripts/lib.mjs"], "line stripped");
});

test("excludes vendor paths", () => {
  const body = "packages/x/vendor/rails/foo.ts and packages/x/src/foo.ts\n";
  assertEqual(extractStoryPaths(body), ["packages/x/src/foo.ts"], "vendor dropped");
});

test("dedupes a path cited twice", () => {
  const body = "scripts/cli.ts does X. Later, scripts/cli.ts does Y.\n";
  assertEqual(extractStoryPaths(body), ["scripts/cli.ts"], "deduped");
});

test("returns [] for a body with no paths", () => {
  assertEqual(extractStoryPaths("Just prose about Relation#merge.\n"), [], "empty");
});

test("caps at 20 entries", () => {
  const body = Array.from({ length: 31 }, (_, i) => `packages/p/src/f${i}.ts`).join("\n");
  const paths = extractStoryPaths(body);
  assertEqual(paths.length, 20, "capped");
});

test("orders stably across runs", () => {
  const body = "scripts/z.ts packages/a/src/b.ts scripts/a.mjs packages/a/src/a.tsx\n";
  const expected = ["packages/a/src/a.tsx", "packages/a/src/b.ts", "scripts/a.mjs", "scripts/z.ts"];
  assertEqual(extractStoryPaths(body), expected, "sorted");
  assertEqual(extractStoryPaths(body), extractStoryPaths(body), "stable");
});

test("matches every supported extension", () => {
  const body = "packages/a/x.ts packages/a/y.tsx packages/a/z.mjs packages/a/w.js\n";
  assertEqual(
    extractStoryPaths(body),
    ["packages/a/w.js", "packages/a/x.ts", "packages/a/y.tsx", "packages/a/z.mjs"],
    "all extensions",
  );
});

test("ignores a Ruby anchor path", () => {
  const body = "Rails does this in activerecord/lib/active_record/relation.rb:120.\n";
  assertEqual(extractStoryPaths(body), [], "no .rb");
});

test("picks the repo-relative tail out of a longer path", () => {
  const body = "https://github.com/o/r/blob/main/packages/a/b.ts\n";
  assertEqual(extractStoryPaths(body), ["packages/a/b.ts"], "tail");
});

if (failures.length > 0) {
  throw new Error(`${failures.length} lib.mjs test failure(s):\n  ${failures.join("\n  ")}`);
}
console.log("lib.test.mjs: all tests passed");
