---
title: "wire-test-support-into-api-compare"
status: in-progress
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 5433
claim: "2026-07-27T18:03:15Z"
assignee: "wire-test-support-into-api-compare"
blocked-by: null
closed-reason: null
---

# wire-test-support-into-api-compare

## Context

The TS extractor already scans all of `packages/activerecord/src/` including
`src/support/` (`scripts/api-compare/extract-ts-api.ts:2324`, `getAllTsFiles`
skips only `.test.ts` and `.d.ts`), so the RFC 0064 support helpers are in the
TS manifest (260 of 681 activerecord files are support/cases/test-helpers).
But every consumer is Ruby-file-driven — `scripts/api-compare/compare.ts:1485`
and `scripts/api-compare/extra-surface.ts:12` iterate Ruby files and resolve
the TS side via `rubyFileToTs` (`scripts/api-compare/conventions.ts:68`) — and
the Ruby manifest covers only `libPath` (`vendor/sources.ts:276`,
`libPathsManifest`). Verified by running `pnpm api:compare --package
activerecord` and `pnpm api:extra --package activerecord --json`: zero
support-dir files appear in any report. The helper ports
(`src/support/ddl-helper.ts`, `schema-dumping-helper.ts`,
`connection-helper.ts`, `adapter-helper.ts`, `fake-adapter.ts`,
`load-schema-helper.ts`, `async-helper.ts`, `config.ts`, `connection.ts`,
`stubs/strong-parameters.ts`) carry only prose `Mirrors:` comments and no
tooling measures their drift.

Full analysis with a per-file suitability table lives in the investigation
doc `api-compare-test-infra-recommendation.md` (worktree
`api-compare-test-infra-investigation-84587c`). Verdict there: wire
`test/support/` only; `cases/helper.rb` (imperative config, cannot be taken
via a dir-scoped libPath without dragging in all of `test/cases/`),
`test/config.rb`, the YAML config files, and `test-helpers/` data mirrors
stay out of api:compare and remain tracked by 0064/0071 stories.

Wiring plan (all machinery exists; one contained extractor change):

- `vendor/sources.ts` rails packages: add
  `{ name: "activerecord-test-support", libPath: "activerecord/test/support" }`
  with no `testPath` (helpers are not test cases).
- `scripts/api-compare/config.ts:18` `PACKAGE_DIR_OVERRIDES`:
  `"activerecord-test-support": "activerecord"`; `config.ts:39`
  `PACKAGE_SRC_SUBDIR`: `"activerecord-test-support": "support"` — the same
  pattern as `actiondispatch` mapping onto `packages/actionpack/src/action-dispatch`.
  `rubyFileToTs` then pairs all ten files exactly (`ddl_helper.rb` to
  `ddl-helper.ts`).
- `scripts/api-compare/extract-ts-api.ts`: subdir de-overlap — when a
  package's src dir is the parent of another package's resolved src dir
  (derivable from `PACKAGE_SRC_SUBDIR` + `PACKAGE_DIR_OVERRIDES`), the
  parent's walk skips that subdir, so activerecord no longer extracts
  `src/support/` and the files appear only in the pseudo-package. This case
  does not arise for actionpack (four sibling subdirs, no parent package),
  so it is a new, small branch in the walk plus tests.
- `scripts/api-compare/unported-files.ts`: one exclusion entry for
  `support/tools.rb` (Rails rake/CI test runner; vitest fills that role, no
  port intended).
- Trails-only files under `src/support/` (canonical-schema, templates,
  ar-db-slots, setup-\*-suite, ...) need NO allowlist churn: extra-surface is
  Ruby-file-driven, so unmatched TS files stay out of scope by construction.
  Genuine drifted extras in the ten paired files get converged or tagged
  `@noRailsEquivalent` with a reason, per the normal flow.

## Acceptance criteria

- `pnpm api:compare --package activerecord-test-support` runs and reports
  the ten `test/support/*.rb` files paired against
  `packages/activerecord/src/support/*.ts`, with `tools.rb` excluded with a
  reason and the fixture data dirs contributing nothing.
- The activerecord package manifest no longer contains `support/` files
  (de-overlap), and `pnpm api:compare --package activerecord` totals are
  otherwise unchanged.
- Extractor de-overlap is covered by a unit test in
  `scripts/api-compare/extract-ts-api.test.ts`.
- No new CI gate: outputs feed the existing reports/stats DB only.
- Mismatches surfaced by the first real run are filed as follow-up stories
  under 0064 (not fixed in this PR) if they exceed a trivial diff.
