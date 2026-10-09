---
title: "activerecord: Migration#changeTable reads a replayed block out of its options parameter"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8708, which made `changeTable` on the abstract schema statements and on `CommandRecorder` take `(tableName, options, block)`.

`Migration#changeTable` and `Migration::Compatibility#changeTable` (`packages/activerecord/src/migration.ts`) still accept the block in the options position and split it with `typeof options === "function"`. Rails' `Compatibility#change_table(table_name, **options)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:588-594`) has one `if block_given?`.

The split is there because of `CommandRecorder#replay` (`packages/activerecord/src/migration/command-recorder.ts`): Rails records a bulk `change_table` as `[:change_table, [table_name], block]` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/command_recorder.rb:142`) and replays it with `migration.send(cmd, *args, &block)` (`:118-122`). trails' `replay` is `rbFSend(migration, cmd, ...args, ...compact([block]))`, so the block lands as the second positional argument. Removing the split reddened `migration.test.ts` "bulk revert" on PostgreSQL and MariaDB.

`createTable`, `createJoinTable` and `dropTable` on `Migration` and `Compatibility` carry the same split for the same reason.

## Acceptance criteria

- [ ] `replay` hands a recorded block to the migration in the position its method declares, so a block is never read out of an options parameter.
- [ ] `Compatibility#changeTable` has Rails' single `if block_given?`; `createTable`, `createJoinTable` and `dropTable` follow where the same change removes their split.
- [ ] `migration.test.ts` "bulk revert" stays green on all three adapters.
