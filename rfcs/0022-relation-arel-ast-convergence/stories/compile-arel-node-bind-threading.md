---
title: "Thread _compileArelNode embedded binds through the outer collector (drop text inlining)"
status: ready
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 250
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#_compileArelNode` (`packages/activerecord/src/relation.ts:4559`, ~14
callers) compiles JOIN ON clauses and order/select fragments to **embedded SQL
text with bind values inlined** (via a `SubstituteBinds` collector since
PR #3300). The values are spliced into a larger query as raw text with no
companion bind array.

Rails does NOT inline these. JOIN `ON` predicates, order, and select fragments
are arel nodes whose binds **thread through the single outer collector** that
compiles the whole `SelectStatement` — they become `?`/`$N` placeholders with
their values in the query's bind array, parameterized end-to-end. Inlining is a
trails-ism that (a) loses parameterization and (b) forces every embedded value
through the adapter quoter as text.

This overlaps RFC 0017 (arel-collector-threading). The audit story must confirm
whether this convergence belongs here or folds into 0017's remaining work.

## Acceptance criteria

- The `_compileArelNode` call sites that build subtrees of a larger compiled
  statement attach the arel node to the outer manager (so its binds thread
  through the one collector) instead of pre-rendering inlined SQL text — matching
  Rails' parameterized JOIN ON / order / select handling.
- `_compileArelNode` is removed, or reduced to the genuinely standalone cases (if
  any) the audit identifies.
- No behavior change in executed SQL semantics; api:compare and test:compare
  deltas non-negative. If scope exceeds 300 LOC, split by call-site cluster via
  new stories — do NOT fan out PRs.

Depends on: audit-bind-inlining-rails-fidelity.
