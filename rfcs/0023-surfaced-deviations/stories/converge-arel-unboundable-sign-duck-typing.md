---
title: "converge-arel-unboundable-sign-duck-typing"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: to-sql.ts:2144-2151 unboundableSign is now pure duck-typing (typeof v.isUnboundable !== 'function' -> 0); the raw-Infinity short-circuit is gone."
---

## Context

`arel-unboundable-sign-duck-types-like-rails` landed as #4876, but
`unboundableSign` still short-circuits raw non-finite Floats.

Rails' `unboundable?` check is purely duck-typed —
`value.respond_to?(:unboundable?) && value.unboundable?`,
`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:905-907` — and a Float
answers `respond_to?` false, so Rails reaches `visit_Float` and raises for
`Infinity`. trails' `unboundableSign`
(`packages/arel/src/visitors/to-sql.ts:1006-1032`, `:1159`) short-circuits a raw
`Infinity` to `1=0` / `1=1` first.

`packages/arel/src/visitors/to-sql.test.ts:602-620` documents this: the
non-finite-Float rule has to be asserted through `visitArray` (`inject_join`,
`to_sql.rb:858`) rather than through `Equality`, precisely because of the
short-circuit, and the comment cites the landed story as the convergence owner.

Converging also changes `Quoted(INFINITY)`, which Rails renders as
`= Infinity` — that fallout is why #4876 stopped short. See
`project_unboundable_bignum_predicate_threading`.

## Acceptance criteria

- `unboundableSign` duck-types like `to_sql.rb:905-907`: only a value that
  actually exposes `unboundable?` short-circuits, so a raw `Infinity` reaches
  `visit_Float` and raises `UnsupportedVisitError`.
- `Quoted(Infinity)` renders as Rails does.
- The `to-sql.test.ts` non-finite-Float test is asserted through `Equality`
  (the Rails path) and the stale
  `arel-unboundable-sign-duck-types-like-rails` citation is removed.
