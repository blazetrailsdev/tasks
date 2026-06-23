---
title: "Convert associations.test.ts standalone association calls to in-class form"
status: in-progress
updated: 2026-06-23
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3981
claim: "2026-06-23T12:02:40Z"
assignee: "convert-associations-test"
blocked-by: null
---

## Context

PR #3544 landed `blazetrails/no-standalone-associations` (rule + autofixer +
site-granular baseline `eslint/no-standalone-associations-exclude.json`, ~1869
grandfathered entries). It already converted two demo sites in
`packages/activerecord/src/associations.test.ts` (`ELParent`/`elChildren`,
`DPost`/`dComments`). `associations.test.ts` is the densest file of standalone
`Associations.hasMany.call(...)` / `belongsTo` / `hasOne` sites.

The autofixer relocates a `.call` into the target class's `static {}` block when
safe (same-file class, has static block, declared before the call, unambiguous);
output is prettier-clean. The `CpkOrder`/`cpkOrderItems` site in this file is a
genuine duplicate-class ambiguity → report-only, must be moved manually.

## Acceptance criteria

- Convert all remaining standalone association `.call` sites in
  `packages/activerecord/src/associations.test.ts` to the in-class
  `this.<macro>(...)` form (autofix where safe; manual for report-only).
- Run `packages/activerecord/scripts/materialize-model-declares.ts` to
  materialize the `declare` accessors for the converted associations.
- Remove the converted file's keys from
  `eslint/no-standalone-associations-exclude.json` (regenerate via
  `pnpm tsx scripts/generate-standalone-associations-exclude.ts`).
- `npx eslint packages/activerecord/src/associations.test.ts` reports zero
  `blazetrails/no-standalone-associations` errors with no grandfathered entries
  for this file.
- The file's tests still pass; stay under the 500-LOC PR ceiling (split if needed).
