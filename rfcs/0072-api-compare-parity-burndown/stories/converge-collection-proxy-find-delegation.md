---
title: "converge-collection-proxy-find-delegation"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5910
claim: "2026-08-02T18:19:30Z"
assignee: "converge-collection-proxy-find-delegation"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#find` is a one-line delegation
(`collection_proxy.rb:107-109`):

```ruby
def find(*args)
  return super if block_given?
  @association.find(*args)
end
```

trails instead reimplements the whole scan in the proxy —
`packages/activerecord/src/associations/collection-proxy.ts:3324`,
`override async find(...)` — with its own `inverseOf && _targetLoaded` gate,
its own `normalizeFindArgs` call, its own strict-loading check, and its own
in-memory match over `this._target` keyed through `String(...)`.

So `CollectionAssociation#find`
(`packages/activerecord/src/associations/collection-association.ts:361`) is
shadowed on the public path: `owner.things.find(id)` never reaches it. Only
`coerceToRecords` (`collection-association.ts:1045`) drives it.

Discovered on PR #5875, which converged the association-level body to Rails
(`find_by_scan` no longer raises; `find` does the
`Array(result).size != args_flatten.size` check and raises through
`scope.raise_record_not_found_exception!`; scan keys compare in `to_s`
shape). The consequence is that Rails' own
`test_raise_record_not_found_error_when_invalid_ids_are_passed` /
`test_raise_record_not_found_error_when_no_ids_are_passed` — ported into
`InverseHasManyTests` in that PR — exercise the proxy copy and passed on
baseline, so the regression coverage for the association body had to go in a
trails-only file (`collection-association-find-not-found.trails.test.ts`)
driving the association instance directly.

Two divergent implementations of one Rails method is exactly the shape that
lets them drift: any future fix to one silently misses the other.

## Acceptance criteria

- `CollectionProxy#find` delegates to the association's `find`, mirroring
  `collection_proxy.rb:107-109` (including the `return super if block_given?`
  arm, or a documented note at the call site if trails has no block analogue).
- The proxy's duplicated scan / `normalizeFindArgs` / strict-loading code is
  removed rather than left dead; whatever of it is load-bearing (e.g. the
  strict-loading check, composite-PK arity errors) moves into the association
  body so both entry points get it.
- `collection-association-find-not-found.trails.test.ts` can then be reduced
  or dropped in favour of driving the proxy, since the Rails tests would
  finally cover the association path.
- Watch for behaviour the proxy copy has and the association body lacks
  before deleting it — notably `_checkStrictLoading()` and the fresh-scope
  rebuild comment at `collection-proxy.ts:3337-3345` (a proxy loaded empty
  before the owner was saved must not scan its stale target).
