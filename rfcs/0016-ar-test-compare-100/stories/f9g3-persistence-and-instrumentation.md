---
title: "F-9g3 — persistence, instrumentation + single-skip tail"
status: done
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 350
priority: 12
pr: 3154
claim: "2026-06-12T18:03:50Z"
assignee: "f9g3-persistence-and-instrumentation"
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. Third of three **file-disjoint** batches split out of
the old F-9g core-misc tail (siblings [[f9-core-misc-tail]] (F-9g1) +
[[f9g2-attributes-and-loading]]). File-disjoint so the three run in parallel
without colliding on a shared test file.

This batch — persistence/lifecycle, instrumentation, and the single-skip long tail:
`base_test.rb` (5), `touch_later_test.rb` (4), `view_test.rb` (2),
`instrumentation_test.rb` (2), `statement_invalid_test.rb` (2), plus the ~10
single-skip files (`finder`, `secure_token`, `delegated_type`, `column_alias`,
`table_metadata`, `types`, `persistence/reload_association_cache`, `active_record`,
etc.).

## Acceptance criteria

- [ ] Drive the listed files to 0 matched-skips; reclassify any genuinely-permanent
      skip (Ruby encoding/Symbol/const_missing) into `unported-files.ts` with a
      reason rather than leaving `it.skip`.
- [ ] ≤500 LOC; touched test files only (per CLAUDE.md — no full-suite run).

## Notes

This is the largest of the three F-9g batches (~25 skips); if the single-skip tail
pushes it past one PR, register a follow-up story rather than fanning out PRs.
