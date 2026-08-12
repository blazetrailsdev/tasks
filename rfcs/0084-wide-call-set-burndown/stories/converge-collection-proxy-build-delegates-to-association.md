---
title: "converge-collection-proxy-build-delegates-to-association"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6411
claim: "2026-08-12T13:06:04Z"
assignee: "activesupport-out-of-closure-unported-entries"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `CollectionAssociation#build` in PR #6394 (RFC 0084), which
restored the Array arm and the nested
`add_to_target(build_record(attributes, &block), replace: true)` shape at
`packages/activerecord/src/associations/collection-association.ts:391-401`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:117-123`).

`CollectionProxy#build`
(`packages/activerecord/src/associations/collection-proxy.ts:1210-1223`) does not
delegate to it. Rails is a two-line delegation
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:315-317`):

```ruby
def build(attributes = nil, &block)
  @association.build(attributes, &block)
end
alias_method :new, :build
```

The port instead re-implements the whole body: its own `Array.isArray` arm, its
own `_isThrough` split into `_buildThrough`/`_buildRaw` (both of which just call
`association.buildRecord`), its own block invocation, and its own
`_replaceOnTarget(record, { replace: true })` — i.e. a parallel copy of
`CollectionAssociation#build`'s branches, now that the association-side method
matches Rails. `new` (`:1226-1239`) carries a second copy of the array split for
overload resolution.

The duplication is why the array arm survived on the proxy while the
association-side one had been dropped, and it is a standing divergence risk:
every future change to `CollectionAssociation#build` has to be mirrored by hand.

## Acceptance criteria

- [ ] `CollectionProxy#build` becomes the Rails delegation to
      `@association.build(attributes, &block)`, with `new` as its alias
      (collection_proxy.rb:315-321).
- [ ] `_buildRaw` / `_buildThrough` are deleted if the delegation leaves them
      with no callers — the through/non-through split already lives on the
      association (`HasManyThroughAssociation#build_record`,
      has_many_through_association.rb:88-114).
- [ ] The TS overload pair stays only where the union return type genuinely
      requires it; the branch duplication in `new` goes away with it.
- [ ] `parity:api:calls` non-negative; collection-proxy, HABTM, has-many and
      nested-attributes suites green on all three adapter lanes.
