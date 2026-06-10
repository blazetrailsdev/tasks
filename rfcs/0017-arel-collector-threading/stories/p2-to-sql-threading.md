---
title: "Phase 2 — Thread collector through to-sql.ts"
status: in-progress
updated: 2026-06-10
rfc: "0017-arel-collector-threading"
cluster: arel-collector-threading
deps:
  - p1-visitor-base-types
deps-rfc: []
est-loc: 400
priority: 2
pr: 3070
claim: "2026-06-09T21:10:53Z"
assignee: "p2-to-sql-threading"
blocked-by: null
---

## Context

The core conversion: add `collector: SQLString` as a second parameter to all 57
`protected visitArel*` methods in `to-sql.ts`, thread it through all internal
`this.visit()` calls, and delete the `this.collector` instance field, the
`_extractBinds` boolean, and the `visit(node)` override that discards the base
collector arg.

This is the largest phase (~300 LOC changed) and the one that achieves the
structural alignment with Rails.

See RFC §Design — "Signature migration" and "Eliminating `_extractBinds`".

## Acceptance criteria

- [ ] All 57 `protected visitArel*` methods in `to-sql.ts` accept
      `(o: Node, collector: SQLString): SQLString`
- [ ] `compile(node)` calls `this.visit(node, new SQLString())` — no
      `this.collector` assignment
- [ ] `compileWithBinds(node)` passes a `Composite` collector directly, no
      `try/finally` save/restore of `_extractBinds`
- [ ] `compileWithCollector(node, collector)` passes `collector` directly as the
      second arg to `this.visit` (or is removed if no callers need the indirection)
- [ ] `this.collector` field deleted
- [ ] `_extractBinds` field and all branches on it deleted
- [ ] `visit(node): SQLString` override (line ~1617) deleted — base `Visitor`
      dispatches correctly
- [ ] `pnpm vitest run packages/arel/src/visitors/to-sql.test.ts` passes
- [ ] TypeScript build clean

## Notes

**`_extractBinds` branches:** three call sites check `this._extractBinds`:
`visitArelNodesCasted` (line ~182), `visitArelNodesBindParam` (line ~1176), and
`visitArelNodesBoundSqlLiteral` (line ~1822). After threading, each collapses to
`collector.addBind(value, this.bindBlock())` — the collector handles routing
(SQLString inserts a placeholder; Bind collects; Composite does both).

**`compileWithCollector` external callers:** `database-statements.ts:284` calls
`visitor.compileWithCollector(node, collector)`. After threading, this method
becomes `return this.visit(node, collector as SQLString)`. Confirm the caller
never passes `null`/`undefined` (currently guarded by `if (externalCollector)`
in the existing implementation).

**500 LOC ceiling check:** run
`git diff --shortstat origin/main...HEAD -- ':!**/pnpm-lock.yaml' ':!**/__snapshots__/**' ':!**/*.md'`
before opening the PR. If over 500, split by moving the `_extractBinds` deletion
into a follow-on story — Phase 2a converts the signatures, Phase 2b removes the
flag.

Rails source: `vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`.
