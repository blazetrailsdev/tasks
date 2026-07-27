---
title: "support/load-schema-helper.ts (support/load_schema_helper.rb)"
status: ready
updated: 2026-07-26
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["move-test-helpers-to-support-dir"]
deps-rfc: []
est-loc: 300
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/support/load_schema_helper.rb` (22 lines) is
`LoadSchemaHelper#load_schema`: silence stdout, load `SCHEMA_ROOT/schema.rb`,
load the adapter-specific schema file if present, then
`ActiveRecord::FixtureSet.reset_cache`.

trails' equivalent is spread across `support/canonical-schema.ts` (2457 lines —
`loadCanonicalSchema`, `rebuildCanonicalTables`) and
`support/schema-file-generator.ts` (`generateSchemaFile`), both invented names.
Note trails' version is genuinely larger than Rails': it generates a schema file
per adapter rather than loading a checked-in `schema.rb`, because
`test-helpers/test-schema.ts` is the TS mirror of `schema.rb` rather than a
loadable Ruby file.

See this RFC's README for the target layout and the A-D disposition.
Assumes `move-test-helpers-to-support-dir` has landed.

## Acceptance criteria

- Introduce `support/load-schema-helper.ts` exposing a `loadSchema` that matches
  `load_schema_helper.rb`'s contract, including the adapter-specific-schema arm
  and the fixture-cache reset.
- Decide explicitly what stays behind: the per-worker template/clone machinery in
  `canonical-schema.ts` has no Rails counterpart (Rails is single-process) and
  should keep its own file and name rather than being crammed into a
  Rails-named one. Say so in the PR body.
- `pnpm schema:compare` output must be unchanged.
- 500 LOC ceiling: `canonical-schema.ts` is 2457 lines, so do NOT attempt to
  move it wholesale. Extract the `load_schema`-shaped entry point only, and
  register any remaining split as a follow-up story.
