---
title: "migration-compatibility-v6-1-for-pre-rails-7-dump-tests"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four `SchemaDumperTest` cases build their table through
`Class.new(ActiveRecord::Migration[6.1])` and assert the pre-Rails-7 datetime
spellings the dump then produces
(`vendor/rails/activerecord/test/cases/schema_dumper_test.rb`):

- `test_timestamps_schema_dump_before_rails_7` (3 assertions)
- `test_timestamps_schema_dump_before_rails_7_with_timestamptz_setting` (3)
- `test_schema_dump_with_correct_timestamp_types_via_add_column_before_rails_7` (3)
- `test_schema_dump_with_correct_timestamp_types_via_add_column_before_rails_7_with_timestamptz_setting` (2)

`Migration.[]` resolves through `Migration::Compatibility.find`
(`activerecord/lib/active_record/migration.rb:629-631`), and trails'
`packages/activerecord/src/migration/compatibility.ts` defines only

```ts
export const V8_0 = Current;
export class V7_2 extends V8_0 {}
export class V7_1 extends V7_2 {}
```

so `Migration[6.1]` raises `Unknown migration version "6.1"`. Rails' chain runs
down to `V4_2` and `V6_1` carries real behaviour (`Compatibility::V6_1`), so an
empty subclass is not a port — the intermediate versions have to be written.

The four trails counterparts are therefore annotated `BLOCKED` skips carrying
no assertions, which is the whole of `schema_dumper_test.rb`'s residual
assertion-parity gap after trails#7859: 4 assertion-count and 4 assertion-kind
rows, 11 assertions in total. A first draft of that PR put the Rails assertions
after the `ctx.skip()` call; review asked for them to come out until the tests
are executable, which is what this story makes possible.

## Acceptance criteria

- `Migration::Compatibility` resolves `Migration[6.1]`, with each intermediate
  version ported from `activerecord/lib/active_record/migration/compatibility.rb`
  rather than declared as an empty subclass.
- The four `SchemaDumperTest` cases above run (on the postgresql lane) and carry
  Rails' assertions verbatim.
- `pnpm parity:test -- --package activerecord --assertions` reports 0
  assertion-count and 0 assertion-kind mismatches for `schema_dumper_test.rb`.
