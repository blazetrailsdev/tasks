---
title: "registerModel accepts non-Base stand-ins, forcing every ported class_attribute reader to re-supply Rails' default"
status: claimed
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-21T00:42:06Z"
assignee: "apply-hook-attribute-type-inside-activemodel-attribute"
blocked-by: null
closed-reason: null
---

## Context

`registerModel` (`packages/activerecord/src/associations.ts:368,402`) accepts
class objects that do not descend from `Base` — `test-fixtures.ts:177`'s
`resolveFixtureNames` registers stand-ins, and `test-fixtures.test.ts:901`
registers a bare `StubModel`. Rails has no analogue: everything that reaches
`ActiveRecord::Base.descendants` bookkeeping _is_ a `Base` subclass, and so
always carries the `class_attribute` defaults its concerns declared.

That gap makes every ported reader that touches a `class_attribute` have to
re-supply the default Rails gets for free. PR #6782 hit it directly: the port
of `CounterCache::ClassMethods#load_schema!` (`counter_cache.rb:186-195`) read
`_reflections` and `counter_cached_association_names` off the constructor and
crashed all three adapter lanes with

    TypeError: Cannot convert undefined or null to object
      at loadSchemaBang (counter-cache.ts)
      at flushPendingCounterCacheColumns
      at registerModel (associations.ts:402)
      at resolveFixtureNames (test-fixtures.ts:177)

and had to be fixed with `?? {}` / `?? []` fallbacks that stand in for
`reflection.rb:11`'s `default: {}` and `counter_cache.rb:9-10`'s `default: []`.
The same shape appears in `getCounterCacheColumns`, which reads
`(modelClass as any)._registryKeys ?? []` for the same reason.

Every such fallback is a silent divergence: it makes a missing class_attribute
indistinguishable from an empty one, and it will be re-derived by the next port
that reads a class_attribute from a registered class.

## Converged shape

Make registration require a `Base` subclass, so a registered class always
carries its declared `class_attribute` defaults and ported readers can read
them the way Rails does.

The test-side stand-ins are the only reason the looser contract exists;
`test-fixtures.ts`'s `resolveFixtureNames` should register the canonical model
(`packages/activerecord/src/test-helpers/models/`) rather than a stub, per
CLAUDE.md's canonical-models rule. Once no non-`Base` class can be registered,
delete the `?? {}` / `?? []` fallbacks in `counter-cache.ts`'s
`loadSchemaBang` and `getCounterCacheColumns`.

## Acceptance criteria

- `registerModel` rejects (or no longer receives) a class that is not a `Base`
  subclass.
- `test-fixtures.test.ts`'s `StubModel` path uses a canonical model or a real
  `Base` subclass.
- The class_attribute default fallbacks in `counter-cache.ts` are deleted and
  the readers name the attribute directly.
- All three adapter lanes green — this is the exact path that reddened them.
