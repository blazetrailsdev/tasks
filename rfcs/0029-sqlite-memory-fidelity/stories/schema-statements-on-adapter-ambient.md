---
title: "schema-statements-on-adapter.test.ts: use ambient connection, not :memory:"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 50
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`connection-adapters/abstract/schema-statements-on-adapter.test.ts` constructs a
fresh `new BetterSQLite3Adapter(":memory:")` in 6 cases
(lines 39, 52, 60, 94, 107, 120). This file is **partly trails-only**: its
primary purpose is proving the `SchemaStatements` module is correctly mixed into
`AbstractAdapter` via the trails `this`-typed `include()` pattern (CLAUDE.md
"Module mixins") — e.g. _"createTable is callable directly on the adapter"_,
_"delegating methods … do not infinitely recurse on base adapter"_. Ruby's
native `include` makes this wiring untestable in Rails, so those smoke cases
have **no Rails counterpart** and the throwaway `:memory:` adapter is a
legitimate fixture (same category as the driver-layer / adapter-construction
tests this RFC leaves alone).

The **DDL behaviors** the cases exercise, however, do have Rails counterparts,
and Rails runs them against the ambient `@connection`
(`ActiveRecord::Base.lease_connection`), file-backed:

- `addForeignKey` with `ifNotExists` (lines 94, 107, 120) →
  `vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:237`
  (`test_add_foreign_key_with_if_not_exists_to_already_referenced_table`,
  `@connection.add_foreign_key … if_not_exists: true`) plus the surrounding
  `test_add_foreign_key_*` cases (`:209`, `:223`).
- `createTable` / `dropTable` / `addColumn` / `columnExists` (lines 39, 52, 60) →
  `cases/migration/column_attributes_test.rb` and `cases/migration_test.rb`,
  all binding to the ambient `@connection`.

So this is a **decide-per-case** story, not a blanket convert.

## Acceptance criteria

- [ ] **Per-case classification first.** For each of the 6 sites, decide:
      _DDL-behavior_ case (mirror the Rails behavior test, run against the
      ambient connection) vs _mixin-wiring smoke_ case (callable-on-adapter /
      no-recursion — keep the throwaway `:memory:` adapter, documented as the
      trails-only mixin exception).
- [ ] DDL-behavior cases (the `addForeignKey ifNotExists` trio at minimum) run
      against the ambient test connection, mirroring `foreign_key_test.rb:237`
      (and `:209`/`:223`) — not a private `:memory:` adapter.
- [ ] Any site left on `:memory:` carries a one-line comment stating it is a
      mixin-wiring smoke test with no Rails counterpart (so a future audit does
      not re-flag it).
- [ ] Test names unchanged; converted cases match the cited Rails behavior.
- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

Read `foreign_key_test.rb` and `column_attributes_test.rb` first to confirm the
ambient `@connection` setup and the exact assertions. The mixin-wiring intent
must survive conversion — a converted case must still demonstrate the method is
reachable through the adapter, which the ambient adapter satisfies equally.
</content>
