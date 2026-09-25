---
title: "migration-compatibility-v5-0-v4-2"
status: ready
updated: 2026-09-25
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

`packages/activerecord/src/migration/compatibility.ts` now carries the chain
down to `V5_1` (trails PR for `assertions-mysql-legacy-migration-engine-innodb-option`).
Rails continues with `V5_0 < V5_1` and `V4_2 < V5_0`
(`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:347-487`):

- `V5_0`: `TableDefinition#primary_key` / `#references` (`:349-362`), `create_table`
  (`:364-385`, the integer/serial primary-key default), `create_join_table` (`:387-390`),
  `add_column` (`:392-400`), `add_reference` (`:402-406`), `compatible_table_definition` (`:408-413`).
- `V4_2`: `TableDefinition#references` / `#timestamps` (`:418-432`), `add_reference`,
  `add_timestamps`, `index_exists?`, `remove_index`, `index_name_for_remove` (`:434-486`).

So `Migration.get(5.0)` / `Migration.get(4.2)` still raise `ArgumentError`, and
Rails' `migration/compatibility_test.rb` cases on `Migration[5.0]` / `[4.2]` have no
counterpart.

## Acceptance criteria

- [ ] `V5_0` and `V4_2` are ported method-for-method from the Rails lines above.
- [ ] `Migration.get(5.0)` and `Migration.get(4.2)` resolve.
- [ ] Any compatibility_test.rb case parked on those versions is un-skipped.
