---
title: "Extractor: arity pairing of reader/writer pairs is nondeterministic (actionview fieldErrorProc)"
status: draft
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports actionview arity as 1216/1216 on some runs and
1214/1216 on others with no source change (observed repeatedly while working on
trails#9385, both with and without `API_COMPARE_FORCE=1`). The two flipping rows in
`scripts/api-compare/output/arity-mismatches.json` are `base.rb`
`field_error_proc` `()` against `base.ts` `fieldErrorProc` `(value)`. The TS side
has `declare static fieldErrorProc` / `declare fieldErrorProc`
(`packages/actionview/src/base.ts:75-76`) plus
`cattrAccessor.call(this, "fieldErrorProc", …)` (`:99`), so reader and writer
members share a name. Which one the arity pairing chooses seems to depend on
iteration order, which varies from run to run.

## Acceptance criteria

- Arity pairing picks the same member on every run for a name that has both a reader and a
  `writer` member: a reader is paired with the Ruby reader, and `name=` with the writer.
- Two consecutive `API_COMPARE_FORCE=1 pnpm parity:api` runs produce byte-identical
  `arity-mismatches.json`; a fixture test covers a cattrAccessor reader/writer pair.
