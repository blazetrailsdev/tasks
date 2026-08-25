---
title: "call-args-ar-predicate-builder-set-handler"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6456
claim: "2026-08-13T03:36:51Z"
assignee: "call-args-ar-predicate-builder-set-handler"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099).
`PredicateBuilder#initialize`
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:12-20`)
registers FIVE handlers through `register_handler`, and `ArrayHandler.new(self)`
is constructed TWICE — once for `Array` and once for `Set`:

```ruby
register_handler(BasicObject, BasicObjectHandler.new(self))
register_handler(Range, RangeHandler.new(self))
register_handler(Relation, RelationHandler.new)
register_handler(Array, ArrayHandler.new(self))
register_handler(Set, ArrayHandler.new(self))
```

trails' `packages/activerecord/src/relation/predicate-builder.ts:50-63` builds
four handlers into named fields instead, and normalizes `Set` to `Array` before
dispatch (`predicate-builder.ts:332`) rather than registering a handler for it.
It also passes a closure to `RangeHandler` where Rails passes `self`. The
`registerHandler` registry already exists (`predicate-builder.ts:493`) — it is
just not what `initialize` uses.

This is the reason on the RFC 0095 baseline row
(`relation/predicate-builder.ts` `initialize` → `new`, Rails `(ref:this)` vs
trails `()`).

## Acceptance criteria

1. `PredicateBuilder`'s constructor registers the five handlers through
   `registerHandler`, in Rails' order, with Rails' arguments (including the
   second `ArrayHandler` for `Set`).
2. Dispatch reads the registry; the `Set`-to-`Array` pre-normalization at
   `predicate-builder.ts:332` is removed.
3. `RangeHandler` receives the builder, as in Rails, not a closure.
4. The `relation/predicate-builder.ts` `initialize` → `new` `kind: "args"`
   baseline row is deleted (only-shrink; no `--write`).
