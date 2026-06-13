---
title: "F-9d — adapter_test query-cache + truncate + pk-reset"
status: claimed
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: "2026-06-13T02:30:08Z"
assignee: "f9d-adapter-querycache-truncate-pkreset"
blocked-by: null
---

## Context

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

## Acceptance criteria

- [ ] Query-cache + truncate tests pass on SQLite; pk-reset pass under PG gating.
- [ ] `test:compare --cached --package activerecord` delta non-negative.
