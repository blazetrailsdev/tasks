---
title: "pg-unskip-stale-blocked-tests-and-port-protocol-version"
status: claimed
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "connection"
packages:
  - "pg"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-23T21:50:04Z"
assignee: "pg-connection-pipeline-sync-and-chunked-rows-mode"
blocked-by: null
closed-reason: null
---

# pg: unskip stale-BLOCKED specs and port protocol_version

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity (`parity:test` 50/53). Three tests
are not passing:

- `packages/pg/test/connection.test.ts:157-158`: "can use conn.reset to restart the connection" is `it.skip`.
- `packages/pg/test/result.test.ts:29-30`: "yields a row as an Enumerator of hashes" is `it.skip`.
- Both carry `// BLOCKED: pg-result-type-map-defaults-to-strings-for-oids-with-no-coder`, and that story is now `done`.
- `connection_spec.rb`'s `context :protocol_version` (`vendor/pg/v1.6.2/spec/pg/connection_spec.rb:964-974`) is missing: "should retrieve the wrie protocol version" and its "should raise an error on a bad connection". `PG::Connection#protocol_version` (C) has no TS port. `serverVersion` (`packages/pg/lib/connection.ts:134-141`) shows the shape: `ConnectionBad` on a bad connection.

## Acceptance criteria

- Unskip both tests, remove the stale `BLOCKED` lines, and fix whatever still fails.
- Port `protocolVersion` and the `protocol_version` context, keeping the Rails test names verbatim.
- `pnpm parity:test --package pg` reports 53/53 with 0 skipped.
