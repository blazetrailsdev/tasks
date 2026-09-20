---
title: "assertions-mysql-legacy-migration-engine-innodb-option"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
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
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/abstract-mysql-adapter/table-options.test.ts`
parks `DefaultEngineOptionTest › legacy migrations contain default ENGINE=InnoDB option`
as `it.skip` with its converged body intact (assertions match Rails'
`assert_match %r{ENGINE=InnoDB}, @log.string` + `assert_match expected, output`),
surfaced while converging
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/table_options_test.rb:110-124`.

Rails builds the migration with `Class.new(ActiveRecord::Migration[5.1])`
(`table_options_test.rb:111`). `Migration[]` is
`ActiveRecord::Migration.[]` → `Compatibility.find`
(`activerecord/lib/active_record/migration.rb:629-631`).

trails' `Migration.get(version)` delegates to `find`
(`packages/activerecord/src/migration/compatibility.ts:7-20`), but
`compatibility.ts` only defines `V8_0`, `V7_2` and `V7_1` (`:22-26`). So
`Migration.get(5.1)` raises `ArgumentError: Unknown migration version "5.1";
expected one of "7.1", "7.2", "8.0"`.

Rails' `V5_1` (and the chain down to it) supplies the legacy default
`ENGINE=InnoDB` table option via `Compatibility::V5_1#create_table`
(`activerecord/lib/active_record/migration/compatibility.rb`), which is the
whole point of this test.

The same gap already parks two schema-dumper tests on `Migration[6.1]`
(`packages/activerecord/src/schema-dumper.test.ts:840-850`).

## Acceptance criteria

- [ ] `Migration.get(5.1)` resolves, i.e. `migration/compatibility.ts` carries the
      chain down to `V5_1`, ported from
      `vendor/rails/activerecord/lib/active_record/migration/compatibility.rb`.
- [ ] `legacy migrations contain default ENGINE=InnoDB option` is un-skipped in
      `table-options.test.ts` and passes on the MySQL lane, with its two
      `match` assertions unchanged.
- [ ] Its `BLOCKED:` line is removed.
- [ ] `pnpm parity:test -- --package activerecord --assertions` reports 0
      mismatches for `adapters/abstract_mysql_adapter/table_options_test.rb`.
