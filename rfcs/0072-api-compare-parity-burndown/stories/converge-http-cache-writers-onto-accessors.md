---
title: "converge-http-cache-writers-onto-accessors"
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

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory (PR
converging `mime-negotiation.ts`). `scripts/api-compare/conventions.ts` maps a
Ruby writer `foo=` onto the SAME camelCase name as its reader, so a
`export function setFoo` sibling is TS surface Rails does not have.

`packages/actionpack/src/action-dispatch/http/cache.ts` exports three such
writers:

- `setLastModified` (line 195) — Rails `Response#last_modified=`,
  `vendor/rails/actionpack/lib/action_dispatch/http/cache.rb`
- `setDate` (line 204) — Rails `Response#date=`
- `setEtag` (line 207) — Rails `Response#etag=`

All three have Ruby readers (`last_modified`, `date`, `etag`) in the same Rails
file; the TS readers are not currently in `cache.ts`, which is itself a
divergence worth checking while converging.

The converged shape is an exported class module holding `get`/`set` accessor
pairs under the Rails name, mixed into hosts via `include()` from
`@blazetrails/activesupport` (which copies accessor descriptors intact), or by
deriving the host from the class prototype. See
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts` for the
landed exemplar.

## Acceptance criteria

- `setLastModified`, `setDate`, `setEtag` no longer exist as `set`-prefixed
  exports; the writers live under the Rails name as `set` accessors.
- Response call sites updated; `response.etag = ...` style assignment works.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Existing actionpack tests stay green.
