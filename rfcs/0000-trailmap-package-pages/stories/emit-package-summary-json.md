---
title: "trails: scripts/parity/package-summary.ts emits per-package, per-site and per-file rows into the parity artifact"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-summary-data
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
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
      `scripts/parity/output/package-summary.json` with three arrays:
      `packages`, `tagSites`, `files`, shaped as in the RFC.
- [ ] `packages[]` carries `railsCounterpart` (or `null`), `description`, a
      count per tag (`@noRailsEquivalent` split `PERMANENT` / `CONVERGEABLE`,
      `@missingRailsCall`, `@missingRailsArgs`, `@missingRailsName`,
      `@inventedArm`, `@perf`, `@inlinedFrom`, `@internal`), each mark and
      baseline count named above, and `PERMANENT-SKIP` tests grouped by cited
      `CLAUDE.md` section.
- [ ] Tag counting reuses the JSDoc parsing the lint rules use, not a fresh
      regex, so a tag named in prose is not counted.
- [ ] `files[]` has one row per Rails file api-compare pairs, with `tsFile`
      `null` for an unported file, methods matched / missing, tests matched /
      total.
- [ ] The `Stage parity outputs` step copies `package-summary.json` and the
      per-file api-comparison JSON into the artifact.
- [ ] A unit test over a fixture tree pins each count.

## Verification

`pnpm parity:packages && jq '.packages | length' scripts/parity/output/package-summary.json`
