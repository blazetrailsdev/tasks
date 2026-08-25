---
title: "F-9g1 — calculations + SQL-sanitization tail"
status: done
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 300
priority: 13
pr: 3156
claim: "2026-06-12T18:25:50Z"
assignee: "f9-core-misc-tail"
blocked-by: null
---

## Context

From the 2026-06-10 snapshot. First of three **file-disjoint** batches the old
F-9g tail was split into (siblings [[f9g2-attributes-and-loading]] +
[[f9g3-persistence-and-instrumentation]] cover the rest). The split is by file so
the three can run in parallel without colliding on a shared test file.

This batch — calculation + SQL-building / sanitization residue:
`calculations_test.rb` (5: grouped-association calc + `sanitizeSql` array forms),
`sanitize_test.rb` (1), `unsafe_raw_sql_test.rb` (2), `reserved_word_test.rb` (3),
`reflection_test.rb` (3).

## Acceptance criteria

- [ ] Drive the listed files to 0 matched-skips; reclassify any genuinely-permanent
      skip (Ruby encoding/Symbol/const_missing) into `unported-files.ts` with a
      reason rather than leaving `it.skip`.
- [ ] ≤500 LOC; touched test files only (per CLAUDE.md — no full-suite run).

## Notes

`defaults_test.rb` (13) is NOT here — almost entirely schema-dump default
expressions, gated on [[i1-schema-dumper-columnspec-u3]]; pick it up there.
If this batch exceeds one PR, register a follow-up story rather than fanning out PRs.
