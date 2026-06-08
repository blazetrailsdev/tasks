---
title: "F-8 — small core leftovers"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 250
pr: 3012
claim: "2026-06-08T00:04:43Z"
assignee: "f8-small-core-leftovers"
blocked-by: null
---

## Context

Batch A shipped #2871 (5). 29 remaining across: `statement_cache.test.ts` (3),
`reflection.test.ts` (14), `sanitize.test.ts` (3), `reserved_word.test.ts` (3),
`locking.test.ts` (12), `aggregations.test.ts` (8), `base_prevent_writes.test.ts`
(8), `instrumentation.test.ts` (4), `hot_compatibility.test.ts` (4),
`suppressor.test.ts` (3), `batches.test.ts` (3), 1-2-skip tail.

`column_definition.test.ts` (3) → after I-1. `reflection.test.ts` (4 of 14)
permanently UNPORTED (Ruby Symbol/`const_missing`) → H-3.

## Acceptance criteria

- [ ] Batch by theme; each sub-PR ≤500 LOC.
- [ ] reflection UNPORTED subset (4) reclassified to H-3.
- [ ] I-1-gated `column_definition.test.ts` (3) picked up after I-1.
- [ ] Shared-table collisions avoided (use uniquely-prefixed names or
      `dropExisting:true`).

## Notes

Rails: `test/cases/{statement_cache,reflection,sanitize,reserved_word,locking,
aggregations}_test.rb` etc. Batch by theme, not by file.
