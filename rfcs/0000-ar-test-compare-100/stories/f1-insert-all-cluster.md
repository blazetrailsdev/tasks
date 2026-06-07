---
title: "F-1 — insert_all cluster"
status: claimed
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 250
pr: null
claim: "2026-06-07T20:55:51Z"
assignee: "f1-insert-all-cluster"
blocked-by: null
---

## Context

`insert_all_test.rb` has 41 skips — the largest single core file. Triage into
sub-clusters (upsert_all, returning-clause, on-duplicate/conflict, unique-by,
record-timestamps), each as its own sibling PR.

## Acceptance criteria

- [ ] Audit pass: triage into sub-clusters with sizes and deps.
- [ ] Each sub-cluster un-skipped in a ≤500-LOC sibling PR off `main`.
- [ ] `insert_all_test.rb` skips → 0 on SQLite.

## Notes

Ours: `persistence/insert-all.ts`. Rails: `test/cases/insert_all_test.rb`,
`lib/active_record/insert_all.rb`. CI-runnable (all three backends).
