---
title: "connection.toSql compiles via collector() (drop the compileInlined regex)"
status: ready
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**trails (`main`).** `connection.toSql` inlines bind values through
`compileInlined`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:161-172`,
called from `toSql` :200 and the explain path :312), which does a post-hoc
`sql.replace(/\?|\$\d+/g, …)` over already-rendered SQL with a host-`quote`
fallback. (PR #3300, now **closed unmerged**, would have removed this; it did
not land, so this regex is live on `main`.) This is the only true regex inline
site; the other inline sites use the `substituteBoundValues` helper instead
(see relation-tosql-unprepared-statement, whereclause-tosql-drop-inspectquoter).

**Rails/Arel (vendor/rails v8.0.2).** `database_statements.rb:12-58`
(`to_sql`/`to_sql_and_binds`) compiles through `collector()`
(`abstract_adapter.rb:1176`), which returns a `SubstituteBinds` collector when
`!prepared_statements` (i.e. under `unprepared_statement`) and a
`Composite(SQLString, Bind)` otherwise. There is never a finished placeholder
string to regex over — `SubstituteBinds#add_bind` quotes each value during
traversal via the connection. trails already has `AbstractAdapter#collector()`
(`abstract-adapter.ts:2165`) doing exactly this switch, plus
`Collectors.SubstituteBinds`.

## Acceptance criteria

- `connection.toSql` compiles the arel node through `this.collector()` (or the
  visitor with that collector) instead of `compileInlined`; the post-hoc
  `sql.replace(/\?|\$\d+/g, …)` is deleted.
- Under `unpreparedStatement`, `collector()` already returns `SubstituteBinds`,
  so the inlined output uses the connection's own `quote` (matching Rails) — no
  bespoke per-call quoter.
- If a synchronous unprepared scope is needed (current `unpreparedStatement`
  (`abstract-adapter.ts:1179`) is `async`; `connection.toSql`/`Relation#toSql`/
  `WhereClause#toSql` are sync), add a sync variant or thread the collector
  directly. Scope confirmed by the audit story.
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative.

Depends on: audit-bind-inlining-rails-fidelity.
