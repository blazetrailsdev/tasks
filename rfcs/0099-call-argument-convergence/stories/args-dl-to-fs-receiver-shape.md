---
title: "Decide the to_fs receiver-as-first-argument shape once"
status: done
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6823
claim: "2026-08-21T14:48:15Z"
assignee: "args-dl-adapter-factory-invented-kwarg"
blocked-by: null
closed-reason: null
---

## Context

Three `kind: "args"` rows where Rails calls `to_fs(format)` on a receiver and
the port passes the receiver as a leading argument:

| TS file                           | Ruby                    | Rails                                     | trails                                  |
| --------------------------------- | ----------------------- | ----------------------------------------- | --------------------------------------- |
| `activerecord/src/integration.ts` | `cache_key`             | `timestamp.to_fs(cache_timestamp_format)` | `toFs(timestamp, cacheTimestampFormat)` |
| `activerecord/src/integration.ts` | `cache_version`         | `timestamp.to_fs(cache_timestamp_format)` | `toFs(val, cacheTimestampFormat)`       |
| `activerecord/src/relation.ts`    | `compute_cache_version` | `timestamp.to_fs(cache_timestamp_format)` | `toFs(timestamp, cacheTimestampFormat)` |

`to_fs` is an ActiveSupport core extension on Time/Date, so in Ruby the
receiver is implicit. The port spells core extensions as free functions, which
is the sanctioned trails idiom — meaning these rows are very likely the
`module-mixin-receiver` shape rather than argument defects.

The classifier that RFC 0096 added (`scripts/api-compare/naming-taxonomy.ts`)
already recognises that shape for the `naming` class, and
`scripts/api-compare/receiver-as-first-arg.ts` recognises it for call-set rows.
Neither is consulted for `kind: "args"` shape rows, which is why these three
still flag.

## Acceptance criteria

- Decide, once, whether receiver-as-first-argument on a ported core extension
  is an args-shape defect or a recognised idiom, and apply that decision to all
  three rows identically.
- If idiom: extend the args comparison to classify it — the same way
  `receiver-as-first-arg.ts` does for the call-set gate — so the rows stop
  flagging repo-wide rather than being baselined three times.
- If defect: converge the call sites and delete the rows by hand.
- `pnpm parity:api:calls:args` green either way, and the reasoning recorded
  where the next person will find it.
