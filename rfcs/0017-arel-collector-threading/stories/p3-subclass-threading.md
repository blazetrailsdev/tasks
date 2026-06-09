---
title: "Phase 3 — Thread collector through subclasses"
status: ready
updated: 2026-06-08
rfc: "0017-arel-collector-threading"
cluster: arel-collector-threading
deps:
  - p2-to-sql-threading
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the three `ToSql` subclasses:

- **`mysql.ts`** — 12 `protected override visitArel*` methods
- **`postgresql.ts`** — 13 methods total: 11 in `PostgreSQL` + 2 in
  `PostgreSQLWithBinds` (plus `bindIndex` state migration)
- **`sqlite.ts`** — 6 `protected override visitArel*` methods

Total: 31 override methods (12 + 13 + 6). Also resolves the `bindIndex` instance-field issue
in `PostgreSQLWithBinds`.

See RFC §Design — "Blast radius" and "PostgreSQLWithBinds.bindIndex".

## Acceptance criteria

- [ ] All override `visitArel*` methods in `mysql.ts`, `postgresql.ts`, and
      `sqlite.ts` accept `(o: Node, collector: SQLString): SQLString`
- [ ] `PostgreSQLWithBinds.bindIndex` is no longer an instance field; the `$N`
      index travels with the collector (via a `PostgreSQLSQLString` subclass or an
      equivalent approach that keeps index state off the instance)
- [ ] `PostgreSQLWithBinds.compile`, `compileWithCollector`, `compileWithBinds`
      overrides simplified — no `this.bindIndex = 0` reset in entry methods
- [ ] `pnpm vitest run packages/arel/src/visitors/mysql.test.ts` passes
- [ ] `pnpm vitest run packages/arel/src/visitors/postgres.test.ts` passes
- [ ] `pnpm vitest run packages/arel/src/visitors/sqlite.test.ts` passes
- [ ] TypeScript build clean

## Notes

**`PostgreSQLSQLString` approach (recommended):** subclass `SQLString`, add a
`bindIndex` counter, override `addBind`/`addBinds` to emit `$N`. Pass an instance
of this collector in `PostgreSQLWithBinds.compileWithBinds` instead of a plain
`SQLString`. This mirrors how Rails' PG adapter achieves `$1`/`$2` numbering
through the collector, not through visitor instance state.

**`dot.ts` is excluded** — `Dot extends Visitor` directly, not `ToSql`, and has
no `this.collector`. Its 36 `visitArel*` methods are already on a separate
`Visitor` subclass that doesn't share `ToSql`'s instance-state pattern.

Rails source: `vendor/rails/activerecord/lib/arel/visitors/mysql.rb`,
`postgresql.rb`, `sqlite.rb`.
