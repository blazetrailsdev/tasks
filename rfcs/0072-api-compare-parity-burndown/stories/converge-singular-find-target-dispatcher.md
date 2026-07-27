---
title: "converge-singular-find-target-dispatcher"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/singular-association.ts` currently
exports `findTarget(record, assocName, options, macro)` — a dispatcher that
routes to two private arms, `_findBelongsToTarget` and `_findHasOneTarget`.

Rails has no such shape. `SingularAssociation#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:47-55`)
is the loader body itself, with signature `find_target(async: false)` and no
macro parameter:

```ruby
def find_target(async: false)
  if disable_joins
    async ? scope.load_async.then(&:first) : scope.first
  else
    super.then(&:first)
  end
end
```

`BelongsToAssociation` overrides only the `find_target?` predicate
(`belongs_to_association.rb:124-126`), never `find_target`. One body serves
both macros because the difference lives entirely in the `scope` the
reflection builds.

The dispatcher exists because trails' two loaders arrived as separate ~200-line
engine functions (`loadBelongsTo`, `loadHasOne`) and were relocated by two
independently-specced stories (#5360 and #5363) that both targeted the same
Rails name. The `macro` argument stands in for the receiver class Rails
dispatches on, and is required because both loaders are also called for
association names with no registered reflection, where `options` alone cannot
distinguish the two.

The dispatcher layer is also why
`call-mismatches-wide-exclude/activerecord/associations/singular-association.json`
carries a `scope` entry: the scope construction Rails does inline now sits in
the arms, so the matched `findTarget` body no longer makes the call itself.

## Acceptance criteria

- `findTarget` in `associations/singular-association.ts` is a single body with
  no `macro` parameter, matching Rails' signature shape.
- `_findBelongsToTarget` and `_findHasOneTarget` are gone; the belongs_to /
  has_one difference is expressed through the reflection-built scope, as in
  Rails.
- The `scope` entry is removed from
  `call-mismatches-wide-exclude/activerecord/associations/singular-association.json`
  (the unified body makes the call directly). The `first` entry stays — it is
  `Array#first` over an already-materialized array, justified separately.
- The no-reflection direct-call sites (tests that load an association name with
  no registered reflection) either keep working through the unified body or are
  converted to use real reflections; no silent macro guessing.
- `associations/singular-association.ts` stays at 0 novel extra surface.
- Association suites pass with no test renames.
