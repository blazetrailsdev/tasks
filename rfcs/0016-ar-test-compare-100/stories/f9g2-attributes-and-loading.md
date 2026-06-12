---
title: "F-9g2 — attributes + loading behavior tail"
status: done
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 300
priority: 12
pr: 3155
claim: "2026-06-12T17:43:15Z"
assignee: "f9g2-attributes-and-loading"
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. Second of three **file-disjoint** batches split out
of the old F-9g core-misc tail (siblings [[f9-core-misc-tail]] (F-9g1) +
[[f9g3-persistence-and-instrumentation]]). File-disjoint so the three run in
parallel without colliding on a shared test file.

This batch — attribute access, mass-assignment protection, and loading behaviors:
`attributes_test.rb` (2), `attribute_methods/read_test.rb` (2),
`forbidden_attributes_protection_test.rb` (3), `strict_loading_test.rb` (4),
`clone_test.rb` (2), `inheritance_test.rb` (2).

## Acceptance criteria

- [ ] Drive the listed files to 0 matched-skips; reclassify any genuinely-permanent
      skip (Ruby encoding/Symbol/const_missing) into `unported-files.ts` with a
      reason rather than leaving `it.skip`.
- [ ] ≤500 LOC; touched test files only (per CLAUDE.md — no full-suite run).

## Notes

Rails sources under `activerecord/test/cases/` (+ `attribute_methods/read_test.rb`).
If this batch exceeds one PR, register a follow-up story rather than fanning out PRs.
