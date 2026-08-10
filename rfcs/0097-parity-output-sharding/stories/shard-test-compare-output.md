---
title: "Shard the test-compare output artifacts"
status: closed
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: ["shared-shard-helper"]
deps-rfc: []
est-loc: 340
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "not wanted"
---

## Context

`scripts/test-compare/output/` holds the test-parity pipeline's artifacts, all
monolithic and all gitignored (`.gitignore:4`):

- `ts-tests.json` — written by `extract-ts-tests.ts` (`OUTPUT_DIR` at `:11`),
  run at `ci.yml:1549`
- `rails-tests.json` — written by `extract-ruby-tests.rb` (`ci.yml:1378`)
- `test-comparison-report.json`, `test-comparison-report-v2.json` —
  `compare.ts` (`OUTPUT_DIR` at `:74`), run with `--gates --check` at
  `ci.yml:1549`
- `direct-comparison.json` — `direct-compare.ts:17`
- `convention-comparison.json`

These are keyed per **test file** — a TS `*.test.ts` under `packages/*/src`, and
a Rails `*_test.rb` under the vendored gem — which is the same grain as the
api-compare registers, just with a test-file source path. The RFC 0097 path
convention applies unchanged.

Motive per RFC 0097's generated-artifact half: **diffability and single-file
reads**, not merge conflicts (these are gitignored). Concretely: when
`parity:test` moves, the question is always "which test file changed?", and
today that requires parsing the whole report.

Note the register that is deliberately **not** in scope:
`scripts/test-compare/assertion-mismatch-mark.json`
(`lint-assertion-mismatches.ts:43`) holds per-**package** counters, not
per-source-file rows. RFC 0097's disposition section declines to shard it; do
not migrate it in this PR.

`generate-stubs.ts:19` also constructs an `OUTPUT_DIR` and reads these
artifacts — the permanent-skip stub generator — so it is part of the reader set.

## Acceptance criteria

1. The six artifacts above are written as trees
   `output/<artifact-name>/<package>/<test file path → .json>` via the RFC 0097
   shared helper; every reader loads the merged view via `loadSharded`.
2. Merged content equals today's artifacts exactly. `pnpm parity:test` and
   `compare.ts --gates --check` report identical numbers and identical gate
   verdicts before and after.
3. The `.rb→.json` / `.ts→.json` extension mapping is declared per tree and a
   path with the wrong extension throws (the shared helper's guard), not writes.
4. Partial-scope runs are still distinguishable from full runs: the compared
   package/file population is carried explicitly in the artifact, never inferred
   from which shards exist.
5. Stale shards from a previous or narrower run are removed by the writer.
6. `assertion-mismatch-mark.json` is untouched, and the PR body says so
   explicitly with RFC 0097's stated reason (per-package counters, no
   source-file grain, sharding would not move the conflict number since nearly
   every edit is to `activerecord`).
7. All `OUTPUT_DIR` consumers updated: `compare.ts:74`,
   `direct-compare.ts:17`, `extract-ts-tests.ts:11`, `generate-stubs.ts:19`,
   `orchestrate.ts:56`.
8. `.gitignore:4` already ignores the directory; verify and state the result.
9. No committed register bytes change.
