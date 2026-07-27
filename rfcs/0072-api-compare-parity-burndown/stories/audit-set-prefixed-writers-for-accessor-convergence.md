---
title: "audit-set-prefixed-writers-for-accessor-convergence"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5385
claim: "2026-07-27T01:26:55Z"
assignee: "audit-set-prefixed-writers-for-accessor-convergence"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` to the SAME
camelCase name as its reader — a TS setter or assignable property. Two exported
functions in one module cannot share a name, so modules that port a Rails
reader/writer pair as `export function foo` + `export function setFoo` break
that rule and need an allowlist/`@noRailsEquivalent` entry for the `setFoo`
half.

`packages/actionpack/src/abstract-controller/caching.ts` was converged this way
in the `converge-cache-store-writer-onto-accessor` story: the pair now lives on
an exported class (`ConfigMethods`) with `get cacheStore()` / `set cacheStore()`,
mixed into hosts via `include()` from `@blazetrails/activesupport` (which copies
accessor descriptors from class modules intact).

Rails has ~633 distinct `foo=` writers; trails has ~95 `export function setX`
declarations. Audit which of those `setX` exports actually mirror a Ruby `foo=`
whose reader lives in the same file, and converge them onto the accessor-pair
shape (or record why they can't).

## Acceptance criteria

- Inventory of `export function setX` declarations that shadow a Rails `foo=`
  writer whose reader is in the same TS file.
- Each such pair either converged onto an accessor pair under the Rails name,
  or documented with a concrete reason it cannot be.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags added for
  the `setX` shape; stale ones removed.
