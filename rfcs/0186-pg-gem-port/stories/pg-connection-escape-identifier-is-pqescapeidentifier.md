---
title: "pg-connection-escape-identifier-is-pqescapeidentifier"
status: draft
updated: 2026-11-19
rfc: "0186-pg-gem-port"
cluster: null
packages: []
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

- `packages/pg/lib/connection.ts` `escapeIdentifier` is an open-coded `"${str.replace(/"/g, '""')}"`, a duplicate of `quoteIdent` without its null-byte raise.
- Gem: `pgconn_escape_identifier`, `vendor/pg/v1.5.9/ext/pg_connection.c:1646`, is `PQescapeIdentifier` and raises `PG::Error` with the connection's error message on failure.
- Caller: `packages/actioncable/lib/subscription-adapter/postgresql.ts` (Rails `actioncable/lib/action_cable/subscription_adapter/postgresql.rb`, `escape_identifier`).

## Acceptance criteria

- [ ] `Connection#escapeIdentifier` mirrors `pgconn_escape_identifier`: encoding arm, the error raise, and its output for `"`, NUL and an empty string, pinned in `packages/pg`.
- [ ] The ActionCable caller is unchanged, or converged if it differs from Rails.
