---
title: "Table proxy forwarders narrow Rails' *args/**options shapes"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping PR #5622 (`port-change-table-test-cases`, RFC 0005),
which mirrored `change_table_test.rb` and fixed the divergences that file pins.
These `Table` forwarders diverge from Rails but are **not** pinned by that file,
so they were left alone rather than fixed blind.

Rails' `Table` proxy
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:829-951`)
forwards `*args, **options` verbatim to `@base`. trails
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`)
narrows several of them to a hand-picked option subset:

- `removeIndex(columnOrOptions, options)` types options as
  `{ column?, name? }`. Rails is `remove_index(column_name = nil, **options)` →
  `@base.remove_index(name, column_name, **options)`, so `unique:`,
  `if_exists:`, `algorithm:` etc. all pass through. #5622's mirrored case
  `t.remove_index :bar, unique: true` needs an `as never` cast because of this
  — the same narrowing a reviewer already caught and fixed on `Table#remove`
  (`remove` now takes the full `ColumnOptions`; see #5622).
- `foreignKey(toTable, options)`, `removeForeignKey(toTableOrOptions)` and
  `isForeignKeyExists(toTableOrOptions)` take one positional arg where Rails
  takes `*args, **options` (`schema_definitions.rb:899, 910, 920`).
- `checkConstraint(expression, options)` / `removeCheckConstraint(...)` /
  `isCheckConstraintExists(...)` likewise (`:929, :938, :949`).

Every one of these is a type-level narrowing, not a runtime bug: the values do
reach `@base`. The cost is that Rails-literal call sites don't typecheck and
need casts, which is exactly what hides real mismatches.

## Acceptance criteria

- The `Table` forwarders above accept the option shapes Rails accepts, without
  casts at Rails-literal call sites.
- The `as never` cast on `t.remove_index :bar, unique: true` in
  `packages/activerecord/src/migration/change-table.test.ts` is removed.
- Any other cast in a mirrored test that exists only because of these
  narrowings is removed too.
- `api:compare` / `test:compare` deltas non-negative. Watch the wide call-set
  ratchet: widening a forwarder can converge baselined entries, which must then
  be hand-removed (never `--write` reseeded).
