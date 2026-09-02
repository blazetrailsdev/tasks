---
title: "sqlite3-and-mysql-bare-missing-rails-call-receipts"
status: ready
updated: 2026-09-02
rfc: "0119-connection-adapter-fidelity"
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

Five `@missingRailsCall` receipts describe an unfinished port arm rather than a
language shortcoming, and named no story before RFC 0124's bare-`CONVERGEABLE`
sweep:

- `connection-adapters/sqlite3-adapter.ts` — `merge`
  (sqlite3_adapter.rb:128-132 builds the config hash the port assembles
  differently), `include?` (sqlite3_adapter.rb:36-41's rescue arm), and
  `new_client` (sqlite3_adapter.rb:807)
- `connection-adapters/abstract/schema-statements.ts` — `limit`, from
  `name.mb_chars.limit(short_limit)` (abstract/schema_statements.rb)
- `connection-adapters/abstract-mysql-adapter.ts` — `column_for`

## Acceptance criteria

- Each call site makes the call Rails makes, and its `@missingRailsCall ... —
CONVERGEABLE sqlite3-and-mysql-bare-missing-rails-call-receipts` receipt comes
  off; no baseline row is added in its place.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
