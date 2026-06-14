---
title: "connection.toSql compiles via collector() (drop the compileInlined regex)"
status: ready
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`connection.toSql` inlines bind values through `compileInlined`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:160-170`),
which still does a post-hoc `sql.replace(/\?|\$\d+/g, …)` over already-rendered
SQL — the same TS-ism PR #3300 removed from the four other inline sites. This is
the fifth and last regex inlining site.

Rails' `ConnectionAdapters::DatabaseStatements#to_sql(arel, binds)` compiles
through `collector()`, which returns a `SubstituteBinds` collector when
`!prepared_statements` (i.e. under `unprepared_statement`) and a `Composite`
otherwise. There is never a finished placeholder string to regex over — the
`SubstituteBinds` collector quotes each value during traversal via the
connection as quoter. trails already has `AbstractAdapter#collector()`
(`abstract-adapter.ts:2161`) doing exactly this switch, plus
`Collectors.SubstituteBinds`.

## Acceptance criteria

- `connection.toSql` compiles the arel node through `this.collector()` (or the
  visitor with that collector) instead of `compileInlined`; the post-hoc
  `sql.replace(/\?|\$\d+/g, …)` is deleted.
- Under `unpreparedStatement`, `collector()` already returns `SubstituteBinds`,
  so the inlined output uses the connection's own `quote` (matching Rails) — no
  bespoke per-call quoter.
- If a synchronous unprepared scope is needed (current `unpreparedStatement` is
  `async`; `connection.toSql`/`Relation#toSql`/`WhereClause#toSql` are sync),
  add a sync variant or thread the collector directly. Scope confirmed by the
  audit story.
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative.

Depends on: audit-bind-inlining-rails-fidelity.
