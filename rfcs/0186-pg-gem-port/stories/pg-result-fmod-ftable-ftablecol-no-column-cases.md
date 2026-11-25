---
title: "pg: Result#fmod/ftable/ftablecol no-typemod and no-table spec examples"
status: claimed
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: result-and-coders
packages: ["pg"]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: "2026-11-25T14:52:59Z"
assignee: "pg-result-fmod-ftable-ftablecol-no-column-cases"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package pg --missing` (origin/main 20bec076f5) reports 3 missing `result_spec.rb` examples:

- `vendor/pg/v1.6.2/spec/pg/result_spec.rb:568` "doesn't raise an exception when a valid index is passed to PG::Result#fmod for a column with no typemod" (expects `-1`).
- `:597` "... PG::Result#ftable for a column with no corresponding table" (expects `0` / `PG::INVALID_OID`).
- `:627` "doesnn't raise ... PG::Result#ftablecol for a column with no corresponding table" (keep the gem's typo so the title matches; expects `0`).

`packages/pg/test/result.test.ts` ports only the positive `fmod` case (`:81`). `Result#fmod` exists at `packages/pg/lib/result.ts:195`. Check whether `ftable` and `ftablecol` exist and match `pgresult_ftable` / `pgresult_ftablecol` (`ext/pg_result.c`), including the out-of-range `ArgumentError`. Port them if they are missing.

## Acceptance criteria

- The three examples are ported under their exact Ruby titles and pass against the live server lane.
- `result_spec.rb` reads 9/9 in `parity:test --package pg`.
