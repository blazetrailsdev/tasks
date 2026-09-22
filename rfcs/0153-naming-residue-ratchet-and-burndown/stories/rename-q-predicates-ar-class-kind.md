---
title: "Rename the AR class-kind Q predicates to isPrimaryClass / isConnectionClass / isApplicationRecordClass"
status: draft
updated: 2026-09-22
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `Q` predicate spelling is rejected: predicates port as `isX` (or the bare
camel / the quoted literal `"x?"` where a sibling collides), never `xQ`. The
drop-q-predicate-suffix PR removed the `Q` candidate from `rubyMethodToTs`
(`scripts/parity/conventions.ts`).

A bare predicate may also port as `hasX` where it reads as possession
(`active_connections?` → `hasActiveConnections`, `key?` → `hasKey`): trails#7981
added `has*` as a candidate after `is*` and the camel form, so either scores.
`is*` stays the default in the tables below.

`connectionClassQ` → `isConnectionClass` already landed in trails#7981.

This slice is the ActiveRecord class-kind predicates:

| trails (declaration)                                                                                                                                                     | Rails                                                                                        | target                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------------------------- |
| `Base.primaryClassQ` — `packages/activerecord/src/base.ts:766`                                                                                                           | `primary_class?` — `connection_handling.rb:323`                                              | `isPrimaryClass`           |
| `ConnectionDescriptor#primaryClassQ` — `connection-adapters/abstract/connection-handler.ts:24,40` (callers `:37,:162`)                                                   | `ConnectionDescriptor#primary_class?` — `abstract/connection_handler.rb:67`                  | `isPrimaryClass`           |
| `PendingMigrationConnection.primaryClassQ` — `migration/pending-migration-connection.ts:26`                                                                              | `PendingMigrationConnection.primary_class?` — `migration/pending_migration_connection.rb:13` | `isPrimaryClass`           |
| `Base.connectionClassQ` — `base.ts:762` (callers `base.ts:793`, `connection-handling.ts`)                                                                                | `connection_class?` — `core.rb:234`                                                          | `isConnectionClass`        |
| `Base.applicationRecordClassQ` — `base.ts:1074`; free function `applicationRecordClassQ` — `inheritance.ts:366` (imported as `_applicationRecordClassQ` at `base.ts:53`) | `application_record_class?` — `core.rb:121`                                                  | `isApplicationRecordClass` |

`connectionClass` (reader, `core.rb`) and `ActiveRecord.applicationRecordClass`
(`active_record.rb:354`) already own the bare camel names, so the `is*` form is
the only valid spelling.

`base.ts:954` already has `declare static isPrimaryClass: typeof
ConnectionHandling.isPrimaryClass` next to the `static primaryClassQ()` at
`:766`. Collapse the two onto one `isPrimaryClass`; don't keep both.

Call sites to sweep: `connection-adapters/pool-config.ts:170`,
`connection-handling.ts` (primaryClassQ, connectionClassQ), `base.ts:767,793`,
tests `primary-class.test.ts` (24), `pool-config.trails.test.ts` (4),
`connection-handling.test.ts`. Tooling fixtures that name the old spelling:
`scripts/api-compare/naming-taxonomy.test.ts`, `scripts/test-compare/normalize-skips.ts`.

Prior art, which this story does NOT replace: `application-record-class-q-in-wrong-file`
and `application-record-class-q-has-two-ports` (0023, draft) handle _placement_
(`core.ts`) and the duplicate port. Their acceptance criteria still say
"`applicationRecordClassQ` remains". Whichever lands first uses
`isApplicationRecordClass`, and the other's AC should be amended to match.

## Acceptance criteria

- `primaryClassQ` and `applicationRecordClassQ` no longer
  exist anywhere in `packages/*/src`. Each is renamed to its target above, and
  `Base` has a single `isPrimaryClass`.
- `pnpm parity:api` activerecord coverage does not drop and gets back the
  `primary_class?` pairs (`abstract/connection_handler.rb`,
  `migration/pending_migration_connection.rb`).
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` are green.
