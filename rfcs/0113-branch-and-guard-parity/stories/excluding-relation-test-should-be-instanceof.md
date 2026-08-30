---
title: "excluding should test is_a?(Relation), not duck-type whereClause/havingClause"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`QueryMethods#excluding` splits its arguments on a class test
(`activerecord/lib/active_record/relation/query_methods.rb:1575`):

```ruby
relations = records.extract! { |element| element.is_a?(Relation) }
```

trails answers that question by duck-typing instead. `isRelationForCombining`
(`packages/activerecord/src/relation/query-methods.ts`) reads `whereClause` and
`havingClause` off the value and checks that each is an object exposing `merge`
and `or`:

```ts
const wc = v.whereClause as Record<string, unknown> | undefined;
const hc = v.havingClause as Record<string, unknown> | undefined;
return typeof wc === "object" && wc !== null && typeof wc.merge === "function" && ...
```

That is a structural stand-in for one `is_a?`, and it is the sort of widening
CLAUDE.md's "no extra abstraction" rule is about: any object that happens to
carry those two members is treated as a Relation.

PR #7208 briefly added an `in` guard here (to stop the read reaching a record's
`method_missing` under a `Proxy` that no longer ships) and then reverted it,
precisely because the guard was patching the duck-typing rather than fixing it.

## Converged shape

`value instanceof Relation` — the direct port of `element.is_a?(Relation)`.

Known hazard before converging: an `instanceof` narrowing can strand test
doubles that were relying on the structural check. Grep the tests for bare
object literals carrying `whereClause` / `havingClause` and convert them to real
`Relation` instances rather than widening the check back out (see
`project_duck_typed_instanceof_widening_props_up_test_doubles` — the "two copies
of the package" justification for duck-typing is usually a false premise, so
verify it rather than assume it).

## Acceptance criteria

- [ ] `excluding` / `without` split their arguments with an `instanceof`
      Relation test, mirroring `query_methods.rb:1575`.
- [ ] `isRelationForCombining`'s structural probe is deleted, or reduced to the
      one `instanceof`.
- [ ] Any test double relying on the structural shape becomes a real Relation.
- [ ] `ExcludingTest` green on all three lanes.
