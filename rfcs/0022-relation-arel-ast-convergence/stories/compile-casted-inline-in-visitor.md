---
title: "Inline Casted in the visitor (Arel-faithful) and delete the InlineBinds collector"
status: draft
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: ["audit-bind-inlining-rails-fidelity", "connection-tosql-via-collector"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Collectors.InlineBinds` (`packages/arel/src/collectors/inline-binds.ts`) is a
trails-only hybrid: it inlines `Casted`/`Quoted` literals but keeps `BindParam`
as `?`. Arel has no such collector — only `SQLString` (all `?`) and
`SubstituteBinds` (all inlined). `InlineBinds` exists because trails routes
`visit_Arel_Nodes_Casted` through `collector.addBind` (`to-sql.ts:220`), so a
plain `SQLString` would render `Casted` as `?`; `InlineBinds` re-inlines it at
the collector layer to keep `compile(table[:x].eq(5))` → `… = 5`.

Arel's `visit_Casted` appends the quoted literal **directly**
(`collector << quoted(o.value, o.attribute)`) and only `visit_BindParam` uses
`add_bind` — which is already how trails' `visit_Quoted` works (`to-sql.ts:1852`,
`collector.append(this.quote(...))`). So the faithful fix is to **make
`visit_Casted` (and `HomogeneousIn`'s casted-values path, `to-sql.ts:710`) inline
directly in the visitor**, after which a plain `SQLString` reproduces Arel's
bare-`compile` behavior (Casted inlined, BindParam `?`) and `InlineBinds` is
unnecessary.

CONFIRMED by the audit (Rails v8.0.2): `visit_Arel_Nodes_Casted` is
`collector << quote(o.value_for_database)` and `visit_Arel_Nodes_Quoted` is an
alias of it — both inline directly; only `BindParam` uses `add_bind`. `compile`
defaults to `SQLString`. So the fix is the visitor-inline direction below; there
is NO `add_bind`-for-Casted variant to consider. `HomogeneousIn` keeps
`add_binds` (already faithful, `to-sql.ts:710`).

## Acceptance criteria

- `ToSql#compile`'s no-collector path uses the Arel-faithful default collector
  (plain `SQLString`) — no `InlineBinds`. `Collectors.InlineBinds` and its test
  are deleted; the collectors index no longer exports it.
- Whichever direction the audit selects, `visit_Casted`/`HomogeneousIn` and the
  `compile` default match the targeted Arel source exactly (cited).
- `Nodes::BindParam.new(v).toSql()` stays `?` (Arel parity).
- Internal callers of `Node#toSql`/`compile` that depended on inlined literals
  are migrated to `connection.toSql` / an explicit `SubstituteBinds` collector
  (inventory from the audit). If that migration exceeds the 300 LOC ceiling,
  register the remaining call-site clusters as separate stories — do NOT fan out
  PRs.
- api:compare and test:compare deltas non-negative; test names unchanged.

Depends on: audit-bind-inlining-rails-fidelity, connection-tosql-via-collector.
