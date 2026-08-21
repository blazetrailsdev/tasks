---
title: "naming-burndown-3-ar-structural-residue"
status: claimed
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T11:39:43Z"
assignee: "came-from-user-suffix-pattern-is-unregistered"
blocked-by: null
closed-reason: null
---

## Context

Successor to the three wave-3 AR slots (`naming-burndown-3-ar-adapters`,
`-ar-persistence-relation`, `-ar-model-encryption-tasks`). PR #6459 converged 24
of their 99 rows and could not close any of the three, because their `>=18 /

> =18 / >=30` thresholds assumed ~5/6/11 unconvergeable rows where direct
> inspection of all 78 survivors found ~57.

Those three stories are stamped `in-progress` against #6459 and `in-progress`
has no reverse transition, so the merge sweep will mark them done. **This story
carries their unfinished remainder** so it is not lost. Each parent story's body
has a `## Progress — PR #6459` section with the full per-row breakdown.

Rows already owned elsewhere and **out of scope here**:
`0096/module-mixin-receiver-this-typed` (~12), `0096/build-with-value-from-hash-arg-order`
(1), `0096/merge-clauses-where-clause-structure` (1),
`naming-burndown-2-ar-associations-a1a3-residue` (4),
`naming-burndown-3-arel-activemodel` (`attribute-methods.ts`, 2), and the pure
tooling-residue rows destined for `naming-gate-flip`.

## In scope — structural (a3) work, each needing more than a rename

1. **`explain` / `ExplainPrettyPrinter#pp`** — Rails' `pp` takes an
   `ActiveRecord::Result` and reads `.columns` / `.rows`
   (`connection_adapters/postgresql/explain_pretty_printer.rb:20-22`); trails'
   `pp(result: Array<Record<string, unknown>>)` takes a row array, so
   `postgresql-adapter.ts#explain` calls `pp(result.toArray())`. Converge the
   signature.
2. **`enum.ts#_enum` (3 rows)** — cannot converge while trails resolves attribute
   aliases inline into an `attrName` local _and_ keeps the Rails `name`
   parameter. Rails resolves aliases inside `decorate_attributes`
   (`enum.rb:240-248`); move the resolution there and the three
   `define_enum_methods` rows close with it.
3. **`query-methods.ts#arel_column_with_table`** — `colStr` cannot become
   `column_name` because a later `typeof columnName === "symbol"` branch needs
   the pre-narrowed value. Per CLAUDE.md a Ruby Symbol is a JS string in trails,
   so that `symbol` arm is itself suspect — audit it against
   `query_methods.rb:1978-1985` before renaming.
4. **`tasks/mysql-database-tasks.ts#create` / `#drop` (2)** — a trails-only
   `requireDatabaseName()` guard stands where Rails reads the `database`
   attribute (`tasks/mysql_database_tasks.rb`).
5. **`tasks/sqlite-database-tasks.ts#establish_connection`** — passes
   `config.configuration` where Rails passes the `DatabaseConfig` itself
   (`tasks/sqlite_database_tasks.rb:72-73`).
6. **`model-schema.ts#yaml_encoder`** — passes the global `typeRegistry` where
   Rails passes the model's own `attribute_types` (`model_schema.rb:447`). Check
   whether this is a real bug for models with declared attribute overrides.
7. **`migration.ts#execute_migration_in_transaction`** — `loaded` is the
   async-resolved migration behind the proxy; Rails passes `migration` straight
   through (`migration.rb:1534`).
8. **`postgresql-adapter.ts#build_statement_pool`** — takes a `client` parameter
   Rails does not have (`postgresql_adapter.rb`, `StatementPool.new(self, ...)`).
9. **`postgresql/database-statements.ts#cast_result`**,
   **`mysql/schema-statements.ts#new_column_from_field`** (threads a lazy
   `createTableInfoFn` where Rails threads `table_name`),
   **`encryption/cipher/aes256-gcm.ts#encrypt`**,
   **`has-one-association.ts#replace`** (`displaced` caches `this.target`
   because the live reader mutates mid-method),
   **`statement-cache.ts#create`** (a `cacheableQuery`-absent fallback branch
   Rails lacks) — audit each against its Rails body and converge or file.

## Acceptance criteria

- [ ] Each numbered item is converged, or carries a call-site justification
      naming the specific TypeScript shortcoming that blocks it, or is filed as
      its own story with the Rails `file:line`.
- [ ] No baseline row is added, widened or reseeded.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green, with
      no new `shape` rows.
- [ ] Touched packages' tests pass on all three adapters.
