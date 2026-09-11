---
title: "Adapter and schema fan-outs follow Rails' sequential map"
status: in-progress
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#7702
claim: "2026-09-11T15:42:18Z"
assignee: "adapter-fan-out-follows-rails-sequencing"
blocked-by: null
closed-reason: null
---

## Context

RFC 0147 Design §2, adapter / schema / statement-cache group. These bodies run a
connection's work under `Promise.all` where the Rails body is a sequential
`.map` / `.each` on one thread. Once the fan-outs run sequentially, same-context concurrency no longer comes from trails itself, and that is what makes `with-connection-drops-lease-fork-and-sibling-checkin` safe.

Sites (trails main `5ee8f3512`, `packages/activerecord/src/connection-adapters/` unless noted):

- `postgresql/schema-statements.ts:138,866,1106`
- `mysql/schema-statements.ts:136`
- `abstract-mysql-adapter.ts:751` (awaits `isMariadb()` / `createTableInfo()` per row)
- `abstract/schema-creation.ts:181,182,185,188`
- `postgresql/schema-creation.ts:60,67`
- `abstract/database-statements.ts:1229`
- `packages/activerecord/src/model-schema.ts:374` (awaits `connection.returnValueAfterInsert` per column)
- `statement-pool.ts:32,54` (awaits concurrent deallocations on one connection)

## Acceptance criteria

- [ ] Each of the 15 sites is checked against its Rails body, and the PR lists
      each one with its Rails `file:line`.
- [ ] Where Rails is sequential, the TS body is sequential (`for … of` with
      `await`).
- [ ] Where Rails is genuinely concurrent (on separate threads), each member
      runs in its own `withExecutionContext`.
