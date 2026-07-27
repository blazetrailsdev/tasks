---
title: "Converge remaining ActionPack/ActionView writers onto accessors"
status: ready
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shape 3 of the RFC for the remaining ActionPack / ActionView writers (6):

| helper               | file                                         | Rails writer        |
| -------------------- | -------------------------------------------- | ------------------- |
| `setFormat`          | `action-dispatch/http/mime-negotiation.ts`   | `format=`           |
| `setFormats`         | `action-dispatch/http/mime-negotiation.ts`   | `formats=`          |
| `setVariant`         | `action-dispatch/http/mime-negotiation.ts`   | `variant=`          |
| `setPathParameters`  | `action-dispatch/http/parameters.ts`         | `path_parameters=`  |
| `setDefaultHeaders`  | `action-controller/metal/default-headers.ts` | `default_headers=`  |
| `setSanitizerVendor` | `actionview` `helpers/sanitize-helper.ts`    | `sanitizer_vendor=` |

`mime-negotiation.ts` is a useful precedent within itself: its sibling
`setIgnoreAcceptHeader` already has a `static set ignoreAcceptHeader` accessor
on `request.ts:403` and is handled by the shape-1 story, so this story should
follow the same host-class placement.

## Acceptance criteria

- Each becomes a `get x()` / `set x(v)` pair on the host class; the exported
  `setX` helper is deleted or made module-private and dropped from barrels.
- Call sites use assignment; tests keep Rails-verbatim names and pass.
- `pnpm api:compare` matches the six `foo=` writers; `pnpm api:extra` shows 6
  fewer extras and no stale entries.
