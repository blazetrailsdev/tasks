---
title: "activerecord: remove the invented branches left in changeTable, dropTable and typeCast's boxed Float arm"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#8708
claim: "2026-10-09T15:28:28Z"
assignee: "activerecord-converge-invented-arms-change-table-drop-table-and-float-type-cast"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-abstract-quoting-and-table-ddl`, which converged `quote`, `quoteColumnName` and `buildCreateTableDefinition` and left three rows in `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/abstract/schema-statements.ts#changeTable` was `+if +if +if +if` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:510-518`): a block-or-options second parameter split by two ternaries, each `yield` wrapped in `if (callback)`, and a `typeof` probe for `supports_bulk_alter?`.
- `connection-adapters/abstract/schema-statements.ts#dropTable` was `+if +if +loop` (`schema_statements.rb:540-545`): a loop stripping a trailing `undefined` or function, then a hand-rolled options split.
- `connection-adapters/abstract/quoting.ts#typeCast` kept one invented `if`: a boxed `Number`, the carrier for a Ruby Float, was unboxed where Rails' `when nil, Numeric, String then value` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:103`) returns the Float itself.

Rulings by the repo owner (2026-10-09), which bound what converging means here:

- **`changeTable` keeps `base` last.** Rails' signature is `(table_name, base = self, **options)`. `Migration` sends one call to an adapter and to a `CommandRecorder`, whose signature is `(table_name, **options)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/command_recorder.rb:136`). Ruby keyword arguments pass over the optional positional; a JS call is positional. This is a language limit.
- **`dropTable` separates its options hash and a passed-down block from one rest list.** Rails' `(*table_names, **options)` also accepts the block `Compatibility#drop_table` passes (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:604-610`). A JS rest parameter must be last. This is a language limit, and it covers the MySQL and PostgreSQL overrides.
- **A bare `Uint8Array` passed to `quote` raises `TypeError`.** Only `Type::Binary::Data` reaches `quoted_binary`; the String arm does not take the byte carrier.
- `Migration#changeTable` and `Compatibility#changeTable` keep their block-or-options split: a replayed bulk `change_table` is recorded as `[table_name]` plus its block (`command_recorder.rb:142`) and arrives as `(name, block)`.

## Acceptance criteria

- [ ] `changeTable` on the abstract schema statements takes its options and its block as separate parameters, and its body has Rails' single `if`.
- [ ] `dropTable` on the abstract schema statements has no trailing-argument stripping loop, and its body has Rails' one loop and one `if`.
- [ ] `typeCast` returns a Float carrier from the `nil, Numeric, String` arm, the drivers unbox it at bind, and no `@inventedArm` receipt remains on it.
- [ ] The invented-direction report shows no row for `changeTable`, `dropTable` or `typeCast` in these two files.
