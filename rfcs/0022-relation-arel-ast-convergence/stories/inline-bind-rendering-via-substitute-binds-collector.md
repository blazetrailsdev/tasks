---
title: "Inline bind rendering via a SubstituteBinds collector (drop post-hoc regex)"
status: closed
updated: 2026-07-04
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 20
pr: 3300
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: audit found InlineBinds is a wrong-layer fix vs Rails v8.0.2; work folds into compile-casted-inline-in-visitor + connection-tosql-via-collector + siblings; PR #3300 closed unmerged"
---

## Context

`ToSql#compile` and the ActiveRecord debug paths (`Relation#toSql`,
`Relation#_compileArelNode`, `WhereClause#toSql`) inline bind values by a
**post-hoc regex** over already-rendered `?`/`$N` SQL — see
`packages/arel/src/visitors/substitute-bound-values.ts`, introduced by the
no-raw-sql burndown (#3263) as a behavior-preserving extraction of the prior
`sql.replace(/\?|\$\d+/g, …)` logic.

Rails does NOT do this. `Relation#to_sql` runs under
`connection.unprepared_statement`, where `Arel::Collectors::SubstituteBinds#add_bind`
appends the quoted value **during AST traversal** — there is never a finished
placeholder string to regex over. The output matches today, but the mechanism
is a TS-ism and the post-hoc regex is fragile (a literal `?`/`$N` inside a
string literal in the SQL could be mis-substituted).

## Acceptance criteria

- Inline rendering goes through a `SubstituteBinds`-style collector that quotes
  values during traversal (mirror `Arel::Collectors::SubstituteBinds`), wired
  so `BindParam` nodes inline their value via the collector's `addBind` rather
  than emitting `?` then regex-replacing.
- `ToSql#compile` and the three AR call sites use that path; no `.replace` over
  rendered SQL remains.
- No behavior change in existing `to-sql` / `where-clause` / `relation` /
  `explain` snapshot output; api:compare and test:compare deltas non-negative.
