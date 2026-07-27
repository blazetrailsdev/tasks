---
title: "Converge activerecord class-slot writers onto accessors"
status: in-progress
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5406
claim: "2026-07-27T13:41:08Z"
assignee: "converge-activerecord-class-slot-writers"
blocked-by: null
closed-reason: null
---

## Context

Shape 3 of the RFC for activerecord (5 writers), each a class-level slot whose
reader already carries the Rails name:

| helper                | file                               | Rails writer          |
| --------------------- | ---------------------------------- | --------------------- |
| `setId`               | `attribute-methods/primary-key.ts` | `id=`                 |
| `setSignedIdVerifier` | `signed-id.ts`                     | `signed_id_verifier=` |
| `setDefaultContext`   | `encryption/context.ts`            | `default_context=`    |
| `setVerboseQueryLogs` | `log-subscriber.ts`                | `verbose_query_logs=` |
| `setRegistry`         | `type.ts`                          | `registry=`           |

`setId` deserves care: `id=` is `ActiveRecord::AttributeMethods::PrimaryKey#id=`
and participates in the attribute-write path, so the accessor must route through
the same `writeAttribute` machinery the helper uses today — do not shortcut it to
a field assignment. Check the composite-primary-key arm before converting.

## Acceptance criteria

- Each becomes a `get x()` / `set x(v)` pair on its host class per
  `scripts/api-compare/conventions.ts:638`; the `setX` export is deleted or made
  module-private.
- `setId` keeps its current write path and composite-PK behavior; existing
  primary-key tests pass with names unchanged.
- `pnpm api:compare` matches the five `foo=` writers; `pnpm api:extra` shows 5
  fewer extras for activerecord and no stale entries.
