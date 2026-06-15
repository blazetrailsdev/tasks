---
title: "Thread _compileArelNode embedded binds through the outer collector (drop text inlining)"
status: claimed
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 250
priority: 6
pr: null
claim: "2026-06-15T02:16:41Z"
assignee: "compile-arel-node-bind-threading"
blocked-by: null
---

## Context

> Reconciled against `main` by the audit: `_compileArelNode` is real on `main`
> (the audit's first-pass scope note that it was "PR #3300-only" was wrong — a
> tooling miss; confirmed present, def at `relation.ts:4613`, ~13 callers). It
> inlines via the post-hoc `substituteBoundValues` helper, not a `SubstituteBinds`
> collector. The already-faithful threading variant
> `_compileArelNodeWithBinds` (`relation.ts:4631`, used for CTE bodies) is the
> shape to converge toward.

**trails (`main`).** `Relation#_compileArelNode`
(`packages/activerecord/src/relation.ts:4613`) compiles JOIN ON clauses and
order/select fragments to **embedded SQL text with bind values inlined**:
`compileWithBinds` then a post-hoc `Visitors.substituteBoundValues(sql, …)`
(`relation.ts:4617`) quoting through the adapter. The values are spliced into a
larger query as raw text with no companion bind array.

**Rails (vendor/rails v8.0.2).** Rails does NOT inline these. JOIN `ON`
predicates, order, and select fragments are arel nodes whose binds **thread
through the single outer collector** that compiles the whole `SelectStatement`
in one `visitor.compile(arel.ast, collector)` pass
(`database_statements.rb:34/43/58`) — they become `?`/`$N` placeholders with
their values in the query's bind array, parameterized end-to-end. Inlining is a
trails-ism that (a) loses parameterization and (b) forces every embedded value
through the adapter quoter as text.

This overlaps RFC 0017 (arel-collector-threading). `_compileArelNodeWithBinds`
(`relation.ts:4631`) already threads binds correctly for CTE bodies; the
convergence is to make the JOIN ON / order / select call sites attach their arel
nodes to the outer manager the same way.

## Acceptance criteria

- The `_compileArelNode` call sites that build subtrees of a larger compiled
  statement attach the arel node to the outer manager (so its binds thread
  through the one collector) instead of pre-rendering inlined SQL text — matching
  Rails' parameterized JOIN ON / order / select handling.
- `_compileArelNode` (`relation.ts:4613`) is removed, or reduced to the
  genuinely standalone cases (if any) the audit identifies; converge call sites
  toward the `_compileArelNodeWithBinds` (`relation.ts:4631`) threading shape.
- No behavior change in executed SQL semantics; api:compare and test:compare
  deltas non-negative. If scope exceeds 300 LOC, split by call-site cluster via
  new stories — do NOT fan out PRs.

Depends on: audit-bind-inlining-rails-fidelity.
