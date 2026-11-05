---
title: "trails: scripts/parity/package-summary.ts emits per-package, per-site and CLAUDE.md-section rows into the parity artifact"
status: in-progress
updated: 2026-11-05
rfc: "0222-trailmap-package-pages"
cluster: package-summary-data
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9743
claim: "2026-11-05T16:21:48Z"
assignee: "emit-package-summary-json"
blocked-by: null
---

## Context

The package pages need numbers no stats.db table holds: receipt tag counts,
mark/baseline counts, `PERMANENT-SKIP` tests and a per-Rails-file map. The
per-file data already exists in `scripts/api-compare/output/api-comparison*.json`
(`results[].files[]`, `scripts/api-compare/compare.ts:26`) and in
`scripts/test-compare/output/convention-comparison.json`; main's
`Rails API/Test Comparison` job uploads `parity-outputs-<sha>`
(`.github/workflows/ci.yml:2458-2471`), today carrying only the test-compare
JSON. Mark files: `scripts/parity/module-count-mark.json`,
`scripts/api-compare/{extra-surface-mark,param-name-mark,predicate-kind-mark}.json`,
`scripts/api-compare/call-mismatches-exclude/`; the sends count is
`scripts/parity/send-count.ts`. See the RFC's "Data" section.

## Acceptance criteria

- [ ] `pnpm parity:packages` runs `scripts/parity/package-summary.ts` and writes
      `scripts/parity/output/package-summary.json` with `packages`, `tagSites`
      and `claudeSections`, shaped as in the RFC's "Data" section;
      `emit-package-file-rows` adds `files`.
- [ ] `packages[]` has one entry per `packages/*/package.json`, carrying
      `railsCounterpart` (or `null`), `description`, `claudeMd` (path or
      `null`), a count per tag (`@noRailsEquivalent` split `PERMANENT` /
      `CONVERGEABLE`, `@missingRailsCall`, `@missingRailsArgs`,
      `@missingRailsName`, `@inventedArm`, `@perf`, `@inlinedFrom`,
      `@internal`), each mark and baseline count named above, and
      `PERMANENT-SKIP` tests grouped by cited section anchor.
- [ ] Params and predicates are `matched` / `total` per package: name-matched
      pairs compared, less the pairs in `output/param-name-mismatches.json`
      and the predicate-kind measurement (`lint-predicate-kinds.ts`) — the
      same shape as the api and calls gates, so a tile can trend a percent.
- [ ] `claudeSections[]` lists every `##` / `###` heading of the root and
      package `CLAUDE.md` files with its GitHub anchor and first paragraph; a
      cited section (`PERMANENT-SKIP:` line or receipt) resolves to an anchor
      in that list, and an unresolved citation fails the script.
- [ ] Tag counting reuses the JSDoc parsing the lint rules use, not a fresh
      regex, so a tag named in prose is not counted.
- [ ] The `Stage parity outputs` step copies `package-summary.json` into the
      artifact.
- [ ] A unit test over a fixture tree pins each count.

## Verification

`pnpm parity:packages && jq '.packages | length' scripts/parity/output/package-summary.json`
