---
title: "converge-fixture-teardown-delete-onto-a-live-connection"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6268
claim: "2026-08-09T01:00:45Z"
assignee: "converge-fixture-teardown-delete-onto-a-live-connection"
blocked-by: null
closed-reason: null
---

## Context

Rails has no per-test fixture-delete step. In the non-transactional path
`teardown_fixtures` only resets the cache and the shared pool
(`activerecord/lib/active_record/test_fixtures.rb`); the rows go away at the
_next_ load, because `insert_fixtures_set` prefixes the inserts with
`table_deletes` and runs the pair inside one `disable_referential_integrity`
block on a freshly-leased connection:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:486-495
def insert_fixtures_set(fixture_set, tables_to_delete = [])
  fixture_inserts = build_fixture_statements(fixture_set)
  table_deletes = tables_to_delete.map { |table| "DELETE FROM #{quote_table_name(table)}" }
  statements = table_deletes + fixture_inserts

  transaction(requires_new: true) do
    disable_referential_integrity do
      execute_batch(statements, "Fixtures Load")
    end
  end
end
```

`test-fixtures.ts`'s `afterEach` delete loop is a trails invention with no
counterpart, and it carries two divergences that PR #6198 surfaced when it gave
the parrot/pirate/treasure join tables real foreign keys:

1. It deletes through the adapter captured in `setAdapters` at seed time. A test
   may have deliberately broken or evicted that connection —
   `transactions.test.ts:1396-1405` monkeypatches `beginDbTransaction` to raise
   and asserts the connection is removed from the pool — so teardown then runs
   on a dead connection. Rails never touches it again; it re-leases at the next
   load.
2. Because of (1), #6198 could not wrap the deletes in
   `disableReferentialIntegrity` unconditionally the way Rails does: PostgreSQL's
   implementation opens a nested transaction for its `ALTER TABLE ... TRIGGER`
   pass, which the poisoned connection re-raises through. The wrap is instead
   applied only when `canonicalForeignKeyDependents()` reports a foreign key
   pointing into the delete set (`test-fixtures.ts`, `afterEach`).

Divergence (2) exists only because of (1); converging the delete onto a live
connection retires both.

## Acceptance criteria

- [ ] Fixture teardown no longer deletes through a connection its pool has
      evicted (or the delete moves to the next load, as Rails does).
- [ ] The `disableReferentialIntegrity` wrap in `test-fixtures.ts`'s `afterEach`
      is unconditional, matching `database_statements.rb:492`, and the
      `canonicalForeignKeyDependents()` conditional is deleted.
- [ ] `transactions.test.ts` "connection removed from pool when begin raises
      after successfully beginning a transaction" stays green on PostgreSQL.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
