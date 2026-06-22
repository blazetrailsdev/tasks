---
title: "Drop receiverless quote/typeCast dispatch (require a host receiver)"
status: ready
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The abstract `quote` / `typeCast` (and the PG/MySQL/SQLite ports) carry a
`this: QuotingDispatchHost | void` signature plus module-level `quotedDate` /
`quotedTime` fallbacks, and SQLite retains a `SQLITE_QUOTING_HOST` so
receiver-less standalone calls still dispatch correctly. This was inherited
from the `quote` self-dispatch wiring (PR #3222) and reused by
`typecast-dispatch-through-quoted-date-quoted-time` (PR #3550). Per pre-release
policy there should be no receiver-less calls — every invocation goes through an
adapter receiver via `.call(this, value)`. The fallback machinery exists only to
keep bare standalone unit-test calls working
(`packages/activerecord/src/connection-adapters/sqlite3/quoting.test.ts`
`typeCast(Temporal.*) — unit`, and many bare `quote(...)`/`typeCast(...)` calls
across the adapter quoting tests).

Relevant files:

- `connection-adapters/abstract/quoting.ts` (`quote`, `typeCast`,
  `dispatchQuotedDate`/`dispatchQuotedTime`, module `quotedDate`/`quotedTime`)
- `connection-adapters/sqlite3/quoting.ts` (`SQLITE_QUOTING_HOST`)
- `connection-adapters/postgresql/quoting.ts`, `mysql/quoting.ts`

## Acceptance criteria

- `this` is required (drop `| void`) on `quote` / `typeCast` across abstract +
  adapter ports so receiver-less invocation is a compile error.
- Remove `SQLITE_QUOTING_HOST` and the module-level fallback branches in the
  dispatch helpers (or keep helpers but require a host).
- Update the bare standalone unit-test call sites to invoke through a host
  receiver (adapter prototype or a minimal host), preserving assertions.
- No behavior change for adapter-routed calls; existing quoting/precision tests
  pass. api:compare / test:compare delta non-negative.
