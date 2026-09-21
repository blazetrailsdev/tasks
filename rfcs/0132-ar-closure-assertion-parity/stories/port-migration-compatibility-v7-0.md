---
title: "port-migration-compatibility-v7-0"
status: closed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "old migration versions (V7_0 and below) are not wanted; operator decision"
---

## Context

`packages/activerecord/src/migration/compatibility.ts` stops at `V7_1`:

```ts
export const V8_0 = Current;
export class V7_2 extends V8_0 {}
export class V7_1 extends V7_2 {}
```

Rails' `activerecord/lib/active_record/migration/compatibility.rb` continues
`class V7_0 < V7_1` (`:40`), `class V6_1 < V7_0` (`:164`), and on down. So
`ActiveRecord::Migration[7.0]` resolves in Rails and `Migration.get(7.0)`
raises `ArgumentError: Unknown migration version "7"; expected one of "7.1",
"7.2", "8.0"` in trails (`migration/compatibility.ts:15`).

Surfaced by RFC 0132: `active_record_schema_test.rb:37-42`'s
`test_schema_without_version_is_the_current_version_schema` asserts
`assert_not schema_class < ActiveRecord::Migration[7.0]` — specifically 7.0,
the version one step below the oldest one trails carries. The port in
`packages/activerecord/src/active-record-schema.test.ts` had to substitute
`Migration.get(7.1)` to run at all. The substitution preserves the assertion's
meaning (`Schema` is `Current`, so it is a subclass of neither), but it does
not cover the compatibility class Rails names.

`V7_0` is a real body, not an empty marker: ~124 lines in Ruby
(`compatibility.rb:40-163`) carrying `LegacyIndexName` (`legacy_index_name`,
`index_name_options`), `add_index`, `add_reference` / `add_belongs_to`,
`change_column`, `change_column_default`, `create_table`, `rename_table`,
`disable_extension`, `add_foreign_key` and `compatible_table_definition`.
Porting it is its own change, and `V6_1` and below are separate again.

## Acceptance criteria

- `V7_0` is ported from `compatibility.rb:40-163`, method for method, and
  `Migration.get(7.0)` resolves.
- `active-record-schema.test.ts`'s `schema without version is the current
version schema` asserts against `Migration.get(7.0)`, matching
  `active_record_schema_test.rb:40`.
- Whether `V6_1` and below follow is decided and, if deferred, filed.
