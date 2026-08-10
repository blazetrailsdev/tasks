---
title: "Unexport remaining writer helpers whose accessor already exists"
status: closed
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: data layer only (arel/activemodel/activerecord per compare.ts:2351); these writers are actionpack/actionview/rack/globalid/activesupport"
---

## Context

Shape 1 of the RFC, remaining packages (6). The Rails-named `static set x`
accessor already exists and delegates to an exported `setX` helper (e.g.
`actionview/src/helpers/sanitize-helper.ts:296` calls `setFullSanitizer`;
`actionpack/src/action-dispatch/http/request.ts:404` calls
`setIgnoreAcceptHeader`). The helper is redundant public surface.

| helper                  | file                                                    |
| ----------------------- | ------------------------------------------------------- |
| `setFullSanitizer`      | `actionview` `helpers/sanitize-helper.ts`               |
| `setLinkSanitizer`      | `actionview` `helpers/sanitize-helper.ts`               |
| `setSafeListSanitizer`  | `actionview` `helpers/sanitize-helper.ts`               |
| `setIgnoreAcceptHeader` | `actionpack` `action-dispatch/http/mime-negotiation.ts` |
| `setParameterParsers`   | `actionpack` `action-dispatch/http/parameters.ts`       |
| `setEnv`                | `activesupport` `process-adapter.ts`                    |

Note both barrels re-export these today
(`actionview/src/helpers/index.ts:54`, `actionpack/.../http/index.ts:59`).

## Acceptance criteria

- Each helper is module-private (or `@internal` where a mixin install site needs
  it) and removed from the barrel re-exports.
- The existing `static set` accessors keep working; tests pass unchanged.
- `pnpm parity:api:extra` reports 6 fewer extras across the three packages, with no new
  stale entries.
