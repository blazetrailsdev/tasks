---
title: "Lazy adapter files carry their own constant tables"
status: in-progress
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9687
claim: "2026-11-03T22:48:22Z"
assignee: "generated-app-vitest-suite-runs-against-packed-packages"
blocked-by: null
closed-reason: null
---

## Context

trails#9681 removed the full-path `registerConstant` seats. Lazily-loaded adapter files sit outside the activerecord entry graph, so `scripts/api-compare/class-paths.ts`'s `placement().at` answers `null` for them and they get no rows in `constants.generated.ts`:

- the PostgreSQL / MySQL / SQLite adapter subclasses;
- `connection-adapters/postgresql/oid/*.ts`;
- `postgresql/column.ts`, `mysql/column.ts`, `sqlite3/column.ts`;
- the `type-metadata.ts` files.

Instead, each file ends with `constSet(ConnectionAdapters[.PostgreSQL[.OID] | .MySQL | .SQLite3], "Name", Klass)`, and `packages/activerecord/src/namespaces.ts` gained `PostgreSQL` / `SQLite3` namespace objects. Root CLAUDE.md § "Call-time constant resolution" says a seat is a plain `Namespace.Name = Klass` assignment, and that `constSet` is only for Rails' own `const_set` sites. The `constSet` here exists only to give the class its Ruby name. Hand-added `residue` rows in `constant-residue.json` are dropped by `--check --record`, because residue is derived from the pairing.

Rails: each class is defined inside `module ActiveRecord; module ConnectionAdapters; module PostgreSQL; module OID` (e.g. `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/bit.rb:4-7`), so the class keyword names it.

## Acceptance criteria

- `class-paths.ts` writes a table for lazily-loaded adapter files. That means extending `LAZY_DIRS` to `activerecord: ["connection-adapters/"]`, naming each table from its path so the three `column.ts` files do not collide, and having each lazy file import its own table, as trailties' `commands/` files do.
- The adapter, OID, column and type-metadata files seat with plain `Owner.Name = Klass` assignments, with no `constSet`. Their Ruby names come from the generated rows.
- `pnpm parity:class-paths --check` is green, and `rbModName` answers the full Ruby path for each class above after a plain-node import of its built `dist` file.
