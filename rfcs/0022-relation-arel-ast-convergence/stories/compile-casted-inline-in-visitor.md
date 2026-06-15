---
title: "Inline Casted in the visitor (Arel-faithful) so a plain SQLString reproduces Arel"
status: done
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: ["audit-bind-inlining-rails-fidelity", "connection-tosql-via-collector"]
deps-rfc: []
est-loc: 150
priority: 3
pr: 3328
claim: "2026-06-15T11:40:08Z"
assignee: "compile-casted-inline-in-visitor"
blocked-by: null
---

## Context

> Reconciled against `main` by the audit (audit-bind-inlining-rails-fidelity).
> There is **no `Collectors.InlineBinds`** on `main` — that name came from the
> closed PR #3300 design and never landed. The actual trails-ism is split
> between (a) `visitArelNodesCasted` routing through `addBind`, and (b)
> `ToSql#compile`'s no-collector path re-inlining post-hoc.

**Rails/Arel (vendor/rails v8.0.2).** `arel/visitors/to_sql.rb:87-90` —
`visit_Arel_Nodes_Casted` appends the quoted literal **directly**
(`collector << quote(o.value_for_database).to_s`) and `visit_Arel_Nodes_Quoted`
is an alias of it. Only `visit_Arel_Nodes_BindParam` (`to_sql.rb:760-761`) uses
`collector.add_bind`. `compile` defaults to a plain `SQLString`
(`to_sql.rb:17`). So with the default collector: `compile(Casted(5))` → `5`,
`compile(BindParam(5))` → `?` — no special collector anywhere.
`HomogeneousIn` keeps `add_binds` (`to_sql.rb:352`).

**trails (`main`).** `visitArelNodesCasted`
(`packages/arel/src/visitors/to-sql.ts:243`) routes through
`collector.addBind` — its inline comment claiming `add_bind` parity is
**factually wrong for v8.0.2**. `visitQuoted` (`to-sql.ts:1875`) already inlines
correctly via `collector.append(this.quote(value))`; `Casted` should mirror it.
Because bare `compile(Casted)` therefore renders `?`, `ToSql#compile`'s
no-collector path (`to-sql.ts:~109-124`) compensates by compiling through a
`Composite(SQLString, Bind)` and then re-inlining non-`BindParam` binds with a
post-hoc `substituteBoundValues` pass. `visitArelNodesHomogeneousIn`
(`to-sql.ts:725`) already mirrors `add_binds` — leave it.

The faithful fix: inline `Casted` directly in the visitor, after which a plain
`SQLString` reproduces Arel's bare-`compile` behavior (Casted inlined,
BindParam `?`) and the post-hoc `Composite`+`substituteBoundValues` block in
`compile()` is deleted.

## Acceptance criteria

- `visitArelNodesCasted` (`to-sql.ts:243`) appends the quoted literal directly
  (mirroring `visitQuoted`, `to-sql.ts:1875`) instead of `collector.addBind`;
  the inline comment is corrected to cite `to_sql.rb:87-88`.
- `ToSql#compile`'s no-collector path uses a plain `SQLString` (Casted inlines
  in the visitor; BindParam → `?`), dropping the `Composite(SQLString, Bind)` +
  post-hoc `substituteBoundValues` block (`to-sql.ts:~109-124`).
- `Nodes::BindParam.new(v).toSql()` stays `?` (Arel parity, `to_sql.rb:760-761`).
- Watch the exec-path: raw-Arel `Casted` (e.g. `table[:x].eq(5)`) previously
  emitted `?` + a bind; it now inlines. `where(id: 5)` is unaffected — it builds
  `attr.eq(QueryAttribute)` via predicate_builder (a real bind), not a `Casted`.
- Internal callers of `Node#toSql`/`compile` that depended on the post-hoc
  inlining are migrated to `connection.toSql` / an explicit `SubstituteBinds`
  collector (done first by connection-tosql-via-collector). If that migration
  exceeds the 300 LOC ceiling, register the remaining call-site clusters as
  separate stories — do NOT fan out PRs.
- api:compare and test:compare deltas non-negative; test names unchanged.

Depends on: audit-bind-inlining-rails-fidelity, connection-tosql-via-collector.
