---
title: "PostgreSQL quote_string escapes without taking with_raw_connection's lease"
status: closed
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-15T12:36:32Z"
assignee: "relation-exec-main-query-with-connection"
blocked-by: null
closed-reason: 'PERMANENT: PostgreSQL quote_string cannot take with_raw_connection. It is reached synchronously from Quoting#quote, Sanitization and the Arel visitor behind Relation#to_sql, so it escapes in process (trails CLAUDE.md § "Adapter facts are prewarmed and peeked").'
---

## Context

`PostgreSQL::Quoting#quote_string` is
`with_raw_connection { |connection| connection.escape(s) }`
(`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb`),
so the escape happens inside a lease on the raw libpq handle.

`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`
`quoteString` escapes with the pure PG rules instead and takes no lease,
because `withRawConnection` is async in trails while `quoteString` is reached
from synchronous quoting paths (`quote`, and every caller below it). PR #7008
replaced its call-set baseline row with a `@missingRailsCall with_raw_connection
— CONVERGEABLE` receipt at the call site; this story retires the receipt.

The escaping itself already matches Rails (PG `standard_conforming_strings`:
double `'`, backslash is ordinary), so the divergence is the missing lease, not
the output.

## Converged shape

`quoteString` takes the lease Rails takes — which requires the synchronous
quoting callers above it to become awaitable, the same sync/async lease flip the
rest of RFC 0073 is doing. Delete the `@missingRailsCall` tag in
`packages/activerecord/src/connection-adapters/postgresql/quoting.ts` when it
lands.

## Acceptance criteria

- [ ] `quoteString` escapes through `withRawConnection`, matching
      `postgresql/quoting.rb`.
- [ ] The `@missingRailsCall with_raw_connection` receipt is deleted, not
      reworded.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
