#!/usr/bin/env node
// CLI entry for tasks-repo validation: loads all content, runs the
// importable validate() core, prints a human-readable report, and exits
// non-zero on any failure. Intended to run in CI and via the pre-commit
// hook. The validation rules live in validate-lib.mjs so CLI mutation
// commands can reuse them against in-memory state and fail fast.
import { loadAll } from "./lib.mjs";
import { validate } from "./validate-lib.mjs";

const { rfcs, stories } = loadAll();
const { errors } = validate({ rfcs, stories });

if (errors.length) {
  console.error(`validation failed (${errors.length} error${errors.length === 1 ? "" : "s"}):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(
  `validated ${rfcs.length} RFC${rfcs.length === 1 ? "" : "s"} and ${stories.length} stor${stories.length === 1 ? "y" : "ies"}.`,
);
