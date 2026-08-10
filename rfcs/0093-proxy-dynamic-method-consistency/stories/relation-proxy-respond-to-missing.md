---
title: "Add has traps + fix ownership test in relation/association dispatch proxies"
status: done
updated: 2026-08-07
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: 6197
claim: "2026-08-07T19:52:41Z"
assignee: "relation-proxy-respond-to-missing"
blocked-by: null
closed-reason: null
---

## Context

`wrapWithScopeProxy` (`packages/activerecord/src/relation/delegation.ts:750`)
and `wrapCollectionProxy` (`packages/activerecord/src/associations.ts:1846`)
implement Rails' `ClassSpecificRelation#method_missing` /
`CollectionProxy#method_missing` (`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:118-131`)
but have **no `has` trap** — the JS spelling of `respond_to_missing?`, which
Rails defines at `delegation.rb:136-138`: a relation responds to a name when
the relation defines it OR the model class does. Today
`"someScope" in relation` and any `respondTo`-style probe answers false for
every name the `get` trap would serve (named scopes, class-method delegation,
Array/Enumerable delegation).

Both traps also use `value !== undefined` as the "do we own this?" test
(`delegation.ts:752-755`, `associations.ts:1847-1856`), which routes an own
property whose stored value is `undefined` (e.g. a declared-but-unset class
field) past the ownership check. Harmless today only because relation fields
are underscore-prefixed; fix by testing `prop in target` before the
value-undefined dispatch, mirroring `command-recorder.ts:25`'s
`Reflect.has(target, prop)` ordering.

## Acceptance criteria

- Both proxies gain a `has` trap answering true for: own/prototype members,
  named scopes in `modelClass._scopes`, delegated Array/Enumerable names, and
  model class methods — matching what `get` fabricates (delegation.rb:136-138).
- Ownership test ordering fixed so an own property with value `undefined` does
  not fall into the delegation path.
- Tests: `in`-operator probes for a named scope, a class method, and a
  delegated array method on both a Relation and a CollectionProxy; regression
  test for the own-undefined-field case.
- `pnpm parity:api:calls` / `parity:api` deltas non-negative.
