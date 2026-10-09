---
title: "activerecord: remove the invented branches left in changeTable, dropTable and typeCast's boxed Float arm"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-abstract-quoting-and-table-ddl`, which converged `quote`, `quoteColumnName` and `buildCreateTableDefinition` and left three rows. `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/abstract/schema-statements.ts#changeTable` is `+if +if +if +if` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:510-518`). The second parameter is `fnOrOptions`, a block or an options hash, split by two ternaries. Each `yield` is wrapped in `if (callback)`, and the `supports_bulk_alter?` probe is a `typeof` guard. Rails' signature is `(table_name, base = self, **options)`. 64 call sites in `packages/*/src` pass the block as the second argument. The same block-or-options split is repeated by `Migration#changeTable` and `Migration::Compatibility#changeTable` (`packages/activerecord/src/migration.ts`), by `CommandRecorder#changeTable` (`packages/activerecord/src/migration/command-recorder.ts`) and by the `changeTable` declaration on `AbstractAdapter` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts`), so the five have to move together.
- `connection-adapters/abstract/schema-statements.ts#dropTable` is `+if +if +loop` (`schema_statements.rb:540-545`). Rails takes `*table_names, **options` and ignores a block. trails strips a trailing `undefined` or function in a loop and then splits the options hash off by hand. The block arrives because `Migration::Compatibility#drop_table` passes it down (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:604-610`) and because `CommandRecorder` inverts `create_table` with its block. A Ruby method accepts a block it never yields to, and a trails block is a trailing positional argument, so the ruling needed first is where that block is dropped. The MySQL and PostgreSQL overrides (`connection-adapters/abstract-mysql-adapter.ts`, `connection-adapters/postgresql/schema-statements.ts`) repeat the split.
- `connection-adapters/abstract/quoting.ts#typeCast` keeps one invented `if`: `value instanceof Number` returns `value.valueOf()`. A boxed `Number` is the carrier for a Ruby Float, and Rails' `when nil, Numeric, String then value` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:103`) returns the Float itself. Folding the boxed `Number` into that arm hands the drivers a boxed value: `connection-adapters/sqlite3-adapter.integer-bind.trails.test.ts` "binds a whole-valued Float attribute as SQLITE_FLOAT" then needs the unboxing at the driver bind, and the mysql2 and pg bind paths need the same check. The arm carries `@inventedArm if — CONVERGEABLE` pointing at this story.

A bare `Uint8Array` is no longer routed to `quotedBinary` by `quote`: it reads as a Ruby String (`rbObjClassname` answers `String`) and now raises `TypeError` "can't quote String". Rails' `when String` arm (`quoting.rb:74-75`) quotes a binary String in place. Decide here whether the String arm takes the byte carrier.

## Acceptance criteria

- [ ] `changeTable` on the abstract schema statements takes its options and its block as separate parameters, and its body has Rails' single `if`; the four forwarders and the call sites follow.
- [ ] `dropTable` has no trailing-argument stripping loop and no hand-rolled options split, in the abstract body and in the MySQL and PostgreSQL overrides.
- [ ] `typeCast` returns a Float carrier from the `nil, Numeric, String` arm, the drivers unbox it at bind, and the `@inventedArm` receipt is deleted.
- [ ] The invented-direction report shows no row for `changeTable`, `dropTable` or `typeCast` in these two files.
