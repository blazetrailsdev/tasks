---
title: "insert_all RETURNING does not resolve aliased attributes"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in d2-insert-all-on-duplicate (PR #3442). With the returning→Result
feature now merged (#3447), `insert_all`/`upsert_all` with `returning:` an
**aliased** attribute is broken: `Builder.returning()`
(packages/activerecord/src/insert-all.ts) emits the alias name verbatim
(`RETURNING "title"`) instead of resolving it to the physical column
(`RETURNING "name" AS "title"`). The INSERT column list already resolves the
alias via `resolveAttributeAliases`, but the RETURNING clause does not, so
SQLite errors `no such column: title`.

Blocks `insert all and upsert all with aliased attributes` in
packages/activerecord/src/insert-all.test.ts (currently `it.skip`), mirroring
Rails insert_all_test.rb:311 (`returning: :title`).

## Acceptance criteria

- [ ] `Builder.returning()` resolves aliased attributes to `"<col>" AS "<alias>"`
      (same alias map the INSERT column list uses).
- [ ] Un-skip `insert all and upsert all with aliased attributes`; passes on
      SQLite and PG.
