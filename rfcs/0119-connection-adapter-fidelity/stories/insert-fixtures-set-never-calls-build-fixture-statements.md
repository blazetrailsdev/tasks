---
title: "insert_fixtures_set builds INSERTs inline, leaving the whole build_fixture_sql path dead"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `insert_fixtures_set` delegates its INSERT construction
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:589-598`
calling `build_fixture_statements`, `:648-654`), which in turn calls
`build_fixture_sql` per table.

trails' `insertFixturesSet`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:642-660`)
builds its INSERTs inline from each fixture's own keys and never calls
`buildFixtureStatements` or `buildFixtureSql` at all — which is why PR #7531
found `buildFixtureSql` had no production caller in the whole repo, and why the
`default_insert_value` gap it fixed had stayed invisible.

Consequence: the fidelity PR #7531 restored in `buildFixtureSql` — schema-cache
column iteration, the virtual-column reject, the unknown-column `FixtureError`,
and the per-adapter `default_insert_value` overrides — does not reach the path
fixtures actually load through. Both bodies exist; only the dead one is correct.

`buildFixtureSql` and `buildFixtureStatements` became async in #7531 (the schema
cache is async), so the caller must await; `insertFixturesSet` is already async.

## Converged shape

Delete the inline INSERT construction from `insertFixturesSet` and call
`buildFixtureStatements` the way `:589-598` does, so the two bodies collapse to
Rails' one path.

## Acceptance criteria

- [ ] `insertFixturesSet` calls `buildFixtureStatements`; the inline
      per-fixture column derivation and its `emptyInsertStatementValue` arm are
      gone.
- [ ] Fixture loading stays green on all three adapters — this is the live
      fixture path, so the canonical fixture suites are the cover.
- [ ] `pnpm parity:api:calls` loses the corresponding row rather than gaining one.
