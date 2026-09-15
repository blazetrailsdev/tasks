---
title: "adapter-helper-supports-predicates-credit"
status: closed
updated: 2026-09-15
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "converged in trails#7780: the four predicates are ported as functions in adapter-helper.ts"
---

## Context

`ts-mirror-name-cannot-express-multi-name-ports` made `ScopedSkipGroup.tsMirrorName`
(`scripts/parity/conventions.ts`) accept `string | string[]`, and the method
comparison (`dedupeRubyMethodInto` in `scripts/api-compare/compare.ts`) now
credits a scoped-skipped Ruby name against those spellings. That credits a TS
**declaration** only.

The `adapter_helper.rb` scoped skip (the four hand-written
`supports_default_expression?` / `supports_non_unique_constraint_name?` /
`supports_text_column_with_default?` / `supports_sql_standard_drop_constraint?`,
`vendor/rails/activerecord/test/support/adapter_helper.rb`) cannot use it: trails
ports them as string KEYS of the `SUPPORTS` record in
`packages/activerecord/src/support/supports.ts:28-67`, not as declarations in
`adapter-helper.ts`. The ~15 `define_method`-generated `supports_*?` siblings in
the same Ruby file already report MISSING in `parity:api`
(`adapter_helper.rb` 6/21), so crediting the four via the table would score them
differently from their identical siblings.

## Acceptance criteria

1. Decide one treatment for all 19 `supports_*?` predicates of `adapter_helper.rb`:
   either port them as `supportsX()` functions in `adapter-helper.ts` (Rails'
   shape), or teach the compare to credit the `SUPPORTS` keys for every one.
2. Delete the `adapter_helper.rb` scoped skip in `conventions.ts`.
3. State the `parity:api` delta for `activerecord-test-support`.
