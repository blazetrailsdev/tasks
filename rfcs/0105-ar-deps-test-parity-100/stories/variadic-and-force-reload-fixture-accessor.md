---
title: "variadic-and-force-reload-fixture-accessor"
status: draft
updated: 2026-09-09
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
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

`packages/activerecord/src/test-fixtures.ts:189-206` builds a fixture accessor
that takes exactly one name. Rails' accessor
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:294-321`) takes
`(*fixture_names)` and a trailing `force_reload`, so `topics(:first, :second)`
returns both records and `topics(:first, true)` re-reads the row from the
database instead of returning the memoized instance.

Two `FixturesWithoutInstantiationTest` cases specify exactly that —
`accessor methods with multiple args` (`fixtures_test.rb:781-784`) and
`reloading fixtures through accessor methods` (`:786-791`) — and #7652 excluded
both in `scripts/parity/unported-files/unscoped.ts` because the closure does not
implement the arguments. That is missing fixture API, not a language limit.

## Converged shape

- The accessor takes a variadic name list: one name returns the record, several
  return an array of them, and an ARRAY argument still raises, which is what
  `nil raises` and `accessor methods with multiple args` both pin
  (`test_fixtures.rb:307-311` raises `StandardError` on a non-Symbol/String).
- A trailing `true` forces a reload through the stored fixture's `find`, matching
  `test_fixtures.rb:299-303`.
- Both cases are ported at their Rails names and their exclusion row is DELETED
  from `unscoped.ts`.

## Acceptance criteria

- `topics("first", "second")` returns both records; `topics(["first", "second"])`
  still throws.
- `topics("first", true)` re-reads the row rather than returning the memoized
  instance, observable by mutating the row behind the accessor first.
- Both cases exist at their Rails names, pass on all three lanes, and their row
  is gone from `unscoped.ts`.
