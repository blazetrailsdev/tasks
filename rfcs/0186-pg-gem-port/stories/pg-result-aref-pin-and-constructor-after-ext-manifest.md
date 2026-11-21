---
title: "pg: restore PG::Result#[] operator pin and pair the constructor once the manifest reads ext C classes"
status: ready
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps:
  - pg-ruby-api-manifest-reads-ext-c-classes
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- trails#10478 ported `PG::Result#[]` as `get` (`vendor/pg/v1.5.9/ext/pg_result.c:1130` `pgresult_aref`, defined at `:1744`). It had to drop the `"PG::Result": { "[]": ["get"] }` row from `OPERATOR_SPELLING_BY_FQN` (`scripts/api-compare/operator-order-spelling.ts`). `build-rails-file-structure-manifest.ts` reds that row as dead, because the Ruby API has no C-defined `PG::Result` members.
- Still open from `pg-result-is-not-an-array-execute-returns-the-raw-driver-result`: `PG::Result`'s `constructor` (`packages/pg/lib/result.ts`) is unpaired. The gem allocates the result in C (`pg_new_result`, `pg_result.c`) and has no `#initialize`. `parity:api:extra --package pg` reads every `result.ts` member as novel until the manifest reads ext C classes.

## Acceptance criteria

- [ ] Once `pg-ruby-api-manifest-reads-ext-c-classes` lands, restore the `PG::Result#[]` → `get` pin, citing `pg_result.c:1744`.
- [ ] `parity:api:extra --package pg` lists no unreceipted extra on `result.ts`. The `constructor` is either receipted as the C allocator's stand-in or paired.
