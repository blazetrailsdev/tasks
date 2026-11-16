---
title: "Parameters#hashFilter omits filter.with_indifferent_access (strong_parameters.rb:1350)"
status: draft
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Parameters#hash_filter` starts with `filter = filter.with_indifferent_access`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1350`)
and reads `filter[key]` from it, and `permit_value` compares that HWIA value to
`EMPTY_HASH` / `EMPTY_ARRAY` and `array_filter?` (`:1361-1374`).

trails#10204 folded `_hashFilter` into `hashFilter`
(`packages/actionpack/lib/action-controller/metal/strong-parameters.ts`) but omits the
`with_indifferent_access` call. Wrapping the filter with
`withIndifferentAccess` (`activesupport/lib/core-ext/hash/indifferent-access.ts`) converts
the nested `{}` / `[]` filters too, so `permitValue`'s `EMPTY_HASH` / `isArrayFilter`
checks stop matching, and the `parameters` test suite goes red (seen while working on #10204).

## Converged shape

- `hashFilter` reassigns `filter = withIndifferentAccess(filter)` and reads `filter.get(key)`.
- `permitValue`'s `EMPTY_HASH` / `EMPTY_ARRAY` / `isArrayFilter` comparisons accept an
  HWIA (or HWIA-converted Array) filter as Ruby's `==` does.

## Acceptance criteria

- `hashFilter` calls `withIndifferentAccess` as Rails does, with no new baseline row.
- `packages/actionpack/test/action-controller/controller/parameters/**` stay green.
