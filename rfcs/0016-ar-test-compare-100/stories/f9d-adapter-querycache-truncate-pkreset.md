---
title: "F-9d — adapter_test query-cache + truncate + pk-reset"
status: draft
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

## Acceptance criteria

Residue from F-9a (#3150). Skipped `AdapterTestWithoutTransaction` entries in
`adapter.test.ts`:

- `create with query cache` (enableQueryCacheBang + create cache-invalidation)
- `truncate` (posts fixture; adapter#truncate integration)
- `truncate with query cache`
- `truncate tables with query cache` (multi-table invalidation)
- `reset empty table with custom pk` (PG-only `resetPkSequenceBang`; Movie fixture)
- `reset table with non integer pk` (PG-only; Subscriber nick-PK fixture)

The pk-reset pair is PG-gated; the truncate/query-cache set is SQLite-runnable
with posts/authors/author_addresses fixtures.

## Additional acceptance criteria

- [ ] Query-cache + truncate tests pass on SQLite; pk-reset pass under PG gating.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
