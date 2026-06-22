---
title: "Un-skip dirty_test (10 skipped)"
status: ready
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`test:compare --package activerecord` reports **10 skipped tests** in
`dirty.test.ts` (mirrors Rails `dirty_test.rb`), part of the 234-test gap from
97% to 100%. No existing 0030 story targets this file.

The TS file is **already canonical** (not in the exclude list). Note: dirty.test.ts
uses a `beforeAll dropExisting` canonical rebuild as a mysql:8 shared-table
shield — preserve that pattern when un-skipping.

Representative skipped cases (read the Rails test first; do not rename):

- `attribute will change!`
- `in place mutation detection`, `in place mutation for binary`
- `changes is correct for subclass`, `changes is correct if override attribute reader`
- `string attribute should compare with typecast symbol after update`
- `mutating and then assigning doesn't ...`, `field named field`

## Acceptance criteria

- Un-skip the dirty-tracking tests in `packages/activerecord/src/dirty.test.ts`,
  converging the implementation where they fail (do NOT rename/reword tests).
- Each un-skipped test passes on sqlite/pg/mysql; the mysql:8 shield stays intact.
- `test:compare --package activerecord` shows the dirty skip count drop toward 0.
