---
title: "residual-skip-tail-sweep"
status: in-progress
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: 5138
claim: "2026-07-23T12:17:50Z"
assignee: "residual-skip-tail-sweep"
blocked-by: null
closed-reason: null
---

## Context

Tail of the 56 counted skips from `test:compare --package activerecord
--incomplete`, after the belongs-to (13), dirty (7), and transactions (4)
clusters and the already-open unskip-configure-connection-failure-recovery
(adapter.test.ts, 1): ~31 skips spread 1–3 per file across ~21 files:
has_many_associations (2: e.g. has-many-associations.test.ts:919 composite-FK
nullify, :2072 create resets cached counters), relations (2: :1061/:1065 where
with delegated ar object; :1668 find or create by race condition is
thread-flavored), query_cache (3 counted of its 9 skips), join_model (:1137),
default_scoping (2), has_one (2), has_one_through (2: private-methods probes —
likely permanent), database_tasks (:20 symbol env name), named_scoping (:466),
nested_through (:658), where (:523 rational for string column), locking
(:932 no locks no wait), uuid (2: legacy-migration schema dumper), cascaded
eager loading (2: STI eager loading), core (:93 inspect singleton), left outer
join (:64 merging multiple left joins), with (:321 CTE unsupported), timestamp
(:317 group by date), standalone_connection (:36 async fallback), binary
(:24 load save), inherited (:4/:10 super filter attributes).

This is an audit-and-burndown sweep: for each, read the Rails test, un-skip the
portable ones (fixing small gaps in place where <~50 LOC), file focused
follow-up stories for any that need real feature work, and reclassify the
JS-impossible ones permanent-skip.

## Acceptance criteria

- Every counted skip outside the three cluster stories is un-skipped,
  reclassified, or covered by a newly filed focused story.
- `--incomplete` overall Skip count for activerecord drops to the belongs-to/
  dirty/transactions clusters only (≤24) after this story.
