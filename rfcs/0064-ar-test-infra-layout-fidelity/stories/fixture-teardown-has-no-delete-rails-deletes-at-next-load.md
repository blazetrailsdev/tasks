---
title: "Fixture teardown has no delete loop; the rows go at the next insert_fixtures_set"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6273
claim: "2026-08-09T02:00:45Z"
assignee: "fixture-teardown-has-no-delete-rails-deletes-at-next-load"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `converge-fixture-teardown-delete-onto-a-live-connection`
(PR #6268), which converged _which connection_ the teardown delete runs on but
left the delete itself in place.

Rails has **no per-test fixture delete at all**. `teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb`) resets the
fixture cache and the shared pool and stops. The rows go away at the _next_
load, because `insert_fixtures_set` prefixes the inserts with `table_deletes`:

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

trails still runs a delete loop in `useFixtures`'s and `useTablelessFixtures`'s
`afterEach` (`packages/activerecord/src/test-fixtures.ts`). Because that loop has
no Rails counterpart, it needed a trails-invented guard to decide when the delete
is safe — `shouldDeleteFixtureRows` (`test-fixtures.ts:242`), whose ~30-line
doc comment explains a PostgreSQL-only skip for rows a still-open transaction
will roll back, plus a MySQL caveat about DDL auto-commit making the DELETE the
only cleanup. None of that exists in Rails, and all of it exists only because
the delete happens at teardown rather than at the next load.

## Converged shape

Move the deletes to the next load, where Rails has them: teardown resets the
cache and the pinned pool only, and the seed path passes the tables it is about
to fill as `insert_fixtures_set`'s `tables_to_delete`, so the DELETE + INSERT
pair runs as one batch inside one `disable_referential_integrity` block on a
freshly-leased connection. `shouldDeleteFixtureRows` and its PG/MySQL special
cases are then deletable in full — the transactional path never needs a delete
(the rollback is the teardown, as `teardown_fixtures` intends), and the
non-transactional path gets one at the next load exactly as Rails does.

Note `insertPreparedFixtureSets` already routes through `insertFixturesSet`, so
the delete half is largely a matter of threading the table list, not new
machinery.

## Acceptance criteria

- [ ] No per-test DELETE loop in `test-fixtures.ts`'s `afterEach` (either path);
      teardown resets cache/pool as `teardown_fixtures` does.
- [ ] Fixture rows are removed by the `table_deletes` half of the next
      `insert_fixtures_set` (`database_statements.rb:486-495`).
- [ ] `shouldDeleteFixtureRows` and its PostgreSQL/MySQL skip conditions are
      deleted, not relocated.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green, including the
      deliberate-error tests that motivated the PG skip
      (`transactions.test.ts`, `statement-invalid.test.ts`).
