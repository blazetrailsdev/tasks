---
title: "Make invented `_` adapter driver plumbing private or receipted"
status: draft
updated: 2026-10-26
rfc: "0208-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit found these invented public `_` names on driver shims with no Rails counterpart: `_handshakePacket`, `_closing`, `_ending`/`_ended`, `_cachedStatement`/`_freshStatement`/`_narrowSpilledBigInts` and `_affectedRowsBeforeWarnings`. They sit at `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:121,147,246`, `postgresql-adapter.ts:207-208`, `sqlite3-adapter.ts:1114-1143`, `sqlite3/database-statements.ts:121-123` and `mysql2/client.ts:45`.

Names owned by `table-name-and-primary-key-are-declared-through-underscore-statics` (RFC 0189) are out of scope here.

## Acceptance criteria

- [ ] Each name is TS-private, or carries `@internal` + `@noRailsEquivalent PERMANENT`.
- [ ] `invented` reaches 0 in these files.
