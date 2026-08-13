---
title: "build-with-value-from-hash-arg-order"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6463
claim: "2026-08-13T13:56:34Z"
assignee: "build-with-value-from-hash-arg-order"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by RFC 0096 wave 3 (`naming-burndown-3-ar-persistence-relation`, PR for
the wave-3 AR bundle). The `call-arg-mismatches` row for
`relation/query-methods.ts#buildWithValueFromHash` is an **argument-order (a1)**
divergence, not a naming one, so the burndown story left it standing.

Rails
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`,
`build_with_value_from_hash`) constructs the node as

```ruby
Arel::Nodes::TableAlias.new(build_with_expression_from_value(value), name)
```

— expression first, alias name second. trails passes `(name, expr)`.

Recorded row:

```text
relation/query-methods.ts | buildWithValueFromHash | new
  RUBY[ref:buildWithExpressionFromValue, ref:name]
  TS  [ref:name, ref:expr]
```

Either the trails node constructor takes its arguments in the opposite order
from Arel's (in which case the _constructor_ is the divergence and should be
converged), or the call site is genuinely reversed. Read
`packages/arel/src/nodes/` before touching either side — a blind reorder will
produce broken SQL.

## Acceptance criteria

- [ ] The Arel node constructor and the `buildWithValueFromHash` call site agree
      with Rails' `(expression, name)` order, or the deviation is documented at
      the call site with the Arel `file:line` that forces it.
- [ ] The `naming`/`shape` row for `buildWithValueFromHash` no longer appears in
      `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`.
- [ ] `with(...)` CTE tests pass on all three adapters.
