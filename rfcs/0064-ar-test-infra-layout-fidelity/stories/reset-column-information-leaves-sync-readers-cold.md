---
title: "resetColumnInformation leaves the cache cold, forcing a non-Rails loadSchema() in every ported test"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6292
claim: "2026-08-09T19:19:19Z"
assignee: "reset-column-information-leaves-sync-readers-cold"
blocked-by: null
closed-reason: null
---

## Context

Surfaced twice while shipping `converge-ddl-schema-cache-recording-into-the-ported-ddl-bodies`
(PR #6284), which deleted the fixture harness' per-test DDL recorder. Both
failures it caused were the same shape, and both were papered over by a
trailing `loadSchema()` the Rails test does not have.

Rails' `reset_column_information` clears the pool's cache entry and stops
there (`vendor/rails/activerecord/lib/active_record/model_schema.rb:523-530`):

    def reset_column_information
      connection_pool.active_connection&.clear_cache!
      ([self] + descendants).each(&:undefine_attribute_methods)
      schema_cache.clear_data_source_cache!(table_name)

      reload_schema_from_cache
      initialize_find_by_cache
    end

Rails' readers then re-read lazily and synchronously on the next access, so a
cleared entry is invisible to the test. trails' sync readers (`columnsHash()`,
`columnNames()`, `columnDefaults`) answer only from a WARM cache — a cleared
entry reads as empty — so every ported test that calls
`resetColumnInformation` has to follow it with an `await Model.loadSchema()`
to re-warm before the assertions run.

Current instances, all added or kept because the assertion is otherwise
vacuous or wrong:

- `packages/activerecord/src/adapters/postgresql/array.test.ts:126-127`,
  `:151-152`, `:256-257` (`array_test.rb:85`, `:95`, `:139` have the bare
  `PgArray.reset_column_information`)
- `packages/activerecord/src/persistence.test.ts` — the `becomes default sti
subclass` and `reset column information resets children` bodies

Two of these were live CI failures on the PG lane (`test_default`,
`test_default_strings` returning `undefined` column defaults) once the
harness recorder stopped clearing and re-reflecting behind the test's back.

The extra call is a Rails-fidelity deviation in the test body, and it is
load-bearing: delete it and the test reds. It also teaches the wrong pattern —
every new port of a `reset_column_information` test copies it.

## Converged shape

Make `resetColumnInformation` leave the cache in a state trails' sync readers
can serve, so the ported bodies match Rails line-for-line with no trailing
re-warm. Under RFC 0031's always-warm premise the natural shape is for
`resetColumnInformation` to re-warm the entry it just cleared (it already has
the pool and the table name) rather than leaving it cold for a lazy reader
that cannot exist here.

Then delete the `await Model.loadSchema()` line at each instance above and
confirm each test still fails on a deliberately broken implementation.

## Acceptance criteria

- [ ] A ported test can call `resetColumnInformation` and immediately read
      `columnsHash()` / `columnDefaults` sync, as Rails does.
- [ ] The trailing `loadSchema()` re-warms listed above are deleted, and the
      bodies match their Rails counterparts.
- [ ] `array_test`'s `test_default` / `test_default_strings` still fail when
      the underlying reflection is broken (not vacuous).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
