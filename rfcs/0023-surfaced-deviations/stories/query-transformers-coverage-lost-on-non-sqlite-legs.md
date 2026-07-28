---
title: "queryTransformers wiring is no longer covered on the PG/MySQL CI legs"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5505 (story `converge-connection-adapters-sqlite3-bespoke-tables`).

`packages/activerecord/src/connection-adapters/sqlite3-adapter.query-transformers.test.ts`
is the only coverage of the `queryTransformers` → `preprocessQuery` →
`sql.active_record` payload ordering. Moving it off a private `:memory:` adapter
onto the ambient connection (RFC 0029) required gating it with
`describeIfSqlite`, so it now skips entirely on the PG and MySQL CI legs. It
previously ran everywhere because it built its own SQLite adapter.

`queryTransformers` is not SQLite-specific — Rails applies `preprocess_query` in
`AbstractAdapter`, so the wiring deserves adapter-agnostic coverage.

## Acceptance criteria

- [ ] The transformer/instrumentation ordering is asserted through a suite that
      runs on all three CI adapter legs (ambient connection, no `describeIfSqlite`),
      or the SQLite-only gating is justified with the Rails `file:line` showing
      the behaviour is adapter-specific.
- [ ] The SQLite-specific `executeBatch` suppression cases may stay gated.
