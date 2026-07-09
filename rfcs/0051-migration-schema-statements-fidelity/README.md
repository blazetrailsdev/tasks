---
rfc: "0051-migration-schema-statements-fidelity"
title: "Migration & SchemaStatements fidelity"
status: closed
created: 2026-07-01
updated: 2026-07-09
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0051 — Migration & SchemaStatements fidelity

## Summary

Collapse trails' parallel schema-DSL onto a single Rails-faithful
`SchemaStatements` path and converge the migration engine (foreign-key
definitions, recorder normalization, migrator guards, invertible revert, index
DDL). Extracted from `0023-surfaced-deviations`.

## Motivation

trails has two parallel schema-DSL implementations where Rails has one:
`Migration.addIndex` delegates to the real adapter path, while
`MigrationContext.addIndex` is a bespoke reimplementation that builds SQL itself
and tracks state in private Maps (`migration.ts:2312`). The divergence spawned a
family of migration/schema deviations that landed in the catch-all.

## Design

- Anchor: collapse `MigrationContext` bespoke schema-DSL onto `SchemaStatements`
  (single source of truth).
- Converge onto the unified path: new ForeignKeyDefinition prefix/suffix+options;
  recorder camelCase column-type normalization; abstract FK mutators honor the
  foreign_keys guard; `createTable` id accepts `IdHashOptions`; index DDL
  (`add_options_for_index_columns` SQL string, PG `quotedIncludeColumnsForIndex`
  delegate).
- Migrator guards: drop the non-Rails `currentDatabase` advisory-lock guard;
  tolerate nil version before the name-dup check; fill invertible-migration
  revert engine gaps.

## Non-goals

- **DDL visitor / TableDefinition#toSql:** shipped under closed 0018.
- **Adapter layout:** shipped under closed 0026.

## Rollout

1. `collapse-migrationcontext-schema-dsl-onto-schemastatements` (foundation)
2. FK/index/recorder convergence onto the unified path
3. Migrator guard + invertible-revert fixes (independent, any order)

## Verification

Migration and schema-statement tests pass on all lanes with a single schema-DSL
path; no bespoke `MigrationContext` SQL assembly remains.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
