---
title: "arel-to-sql-compile-unification"
status: done
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6857
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-to-sql-inline-helpers` (PR for that story inlined
`resolveValueForDatabase` and `cteRelationSelfWraps`; the `compile*`
unification did not fit the LOC ceiling).

`packages/arel/src/visitors/to-sql.ts` still carries 2 novel names
(`pnpm parity:api:extra --package arel`, 2026-08-22, after that PR):

| name                   | line   | note                                                                                                                                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compileWithCollector` | ~:1770 | `this.visit(node, collector ?? new SQLString())` — that is Rails' `Visitor#accept`, which trails already has (`visitors/visitor.ts:68`), not a second `compile`.                                                                |
| `compileWithBinds`     | ~:1780 | builds `Composite(SQLString, Bind)` and returns `[sql, binds, retryable, preparable]`. Rails builds that collector in AR's `DatabaseStatements#to_sql_and_binds` and calls the ONE `compile(node, collector)` (`to_sql.rb:17`). |

`visitors/postgresql.ts:149` `PostgreSQLWithBinds` (1 novel) is the sibling
of the same split and should fall out with it.

`ToSql#compile(node, collector?)` (`to-sql.ts:182-209`) already has the Rails
signature, so the target shape exists — the work is retiring the two variants
onto it.

## Approach

- `compileWithCollector` → callers call `accept(node, collector)` directly.
  ~15 call sites: `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:419`,
  `packages/arel/src/attribute-alignment.test.ts:99`, and
  `packages/arel/src/visitors/to-sql.test.ts` (11 sites).
  NOTE: `to-sql.test.ts:1455` has a test NAME containing `compileWithCollector`;
  it is trails-invented (no Rails counterpart), so check `parity:test` before
  touching the name.
- `compileWithBinds` → move the `Composite(SQLString, Bind)` construction to the
  AR caller (`database-statements.ts:351,410` — Rails' `to_sql_and_binds`) and
  compile through `compile(node, collector)`. ~40 call sites across
  `packages/activerecord/src` and the arel/AR test suites; likely needs its own
  PR from the `compileWithCollector` one.

## Acceptance criteria

- `pnpm parity:api:extra --package arel` for `visitors/to-sql.ts`: novel 2 → 0,
  and `visitors/postgresql.ts` 1 → 0 if `PostgreSQLWithBinds` falls out.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` clean.
- `pnpm vitest run packages/arel` green, plus the AR bind-parameter suites.
- No new `@noRailsEquivalent` tag unless a genuine TS shortcoming is documented.
