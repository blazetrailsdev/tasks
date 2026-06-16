---
title: "defineSchema/useFixtures rebuild should clear PG prepared-statement cache (clear_cache!)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 36
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3482 (RFC 0019). When a test rebuilds a canonical table via
`defineSchema` / `useHandlerFixtures({ schema: TEST_SCHEMA })` mid-file (needed
when bespoke neighbor describes leave a table with a different shape on the
shared worker DB), PostgreSQL raises `cached plan must not change result type`
(PSCE, code 0A000) on the first query that reuses a prepared-statement plan
cached against the old table shape. The error aborts the transaction and
cascades into transactional-fixtures teardown.

Rails avoids this because `create_table`/`drop_table` call `clear_cache!`. Our
`defineSchema`/schema-rebuild path does not deallocate the PG connection's
prepared statements, so callers must manually call
`Base.connection.clearCacheBang?.()` after the rebuild (the workaround applied
in PR #3482's `has_many sti subselect count` describe).

## Acceptance criteria

- [ ] Have `defineSchema` (and the `useFixtures` `{ schema }` rebuild path)
      invoke `clearCacheBang()` after DROP/CREATE DDL, mirroring Rails
      `clear_cache!`.
- [ ] Remove the manual `clearCacheBang()` workaround from
      `has-many-associations.test.ts`.
- [ ] Verify the full file passes on postgres without the manual call.
