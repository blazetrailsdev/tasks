---
title: "assoc-preloadertest-cfk-cpk-canonical"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T20:08:25Z"
assignee: "assoc-preloadertest-cfk-cpk-canonical"
blocked-by: null
---

## Context

Follow-up wave of `associations-test-preloadertest-canonical` (RFC 0019).
The `PreloaderTest` describe in
`packages/activerecord/src/associations.test.ts` still calls `defineSchema`
with bespoke composite-key tables (`cfk_bt_*`, `cfk_hm_*`, `cfk_lbt_*`,
`cfk_thru_*`, `cpk_pl_*`) and defines inline bespoke composite-key models for:

- `preload has many association with composite foreign key` (CfkHm\*)
- `preload belongs to association with composite foreign key` (CfkBt\*)
- `preload loaded belongs to association with composite foreign key` (CfkLBt\*)
- `preload has many through association with composite query constraints` (CfkThru\*)
- `preloads has many on model with a composite primary key through id attribute` (CpkPL\*)
- the CpkPLTarget/CpkPLRef test(s)

Rails backs these with canonical `Sharded::*` / `Cpk::*` models. Convert to the
canonical composite-key models + canonical schema tables, and **remove the
bespoke `defineSchema` block** (the cfk*\*/cpk*\* table declarations) once these
are the only remaining consumers. This wave completes the acceptance criterion
"Remove the describe's bespoke defineSchema block" and drops the file's
`require-canonical-schema` exclude entry.

- trails: `packages/activerecord/src/associations.test.ts` (`PreloaderTest`)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb` (`PreloaderTest`)

## Acceptance criteria

- [ ] Convert all cfk*\*/cpk*\* composite-key preloader tests onto canonical
      composite-key models + canonical TEST_SCHEMA tables.
- [ ] Remove the bespoke `defineSchema` block and the file's exclude entry in
      `eslint/require-canonical-schema-exclude.json` (only after ALL bespoke
      defines in the file are gone — coordinate with the other child waves).
- [ ] Test names match Rails verbatim. test:compare delta non-negative.
- [ ] PR <=500 LOC. No node:_/process._; async fs only.
