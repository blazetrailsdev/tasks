---
title: "F-9a — adapter_test core behaviors"
status: ready
updated: 2026-06-11
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by the 2026-06-10 `test:compare --package activerecord` snapshot (92.6%,
575 skipped). `adapter_test.rb` is the single largest un-owned core cluster:
**40 matched-skips** (plus `database_statements_test.rb` 2,
`adapter_prevent_writes_test.rb` 1, `base_prevent_writes_test.rb` 1). F-8 (#3012,
done) did not cover these. Backbone behaviors, all backends.

Representative skips: `#exec_query` empty-result-set returns empty
`ActiveRecord::Result` / still returns columns; `update prepared statement`;
`remove index when name and wrong column name specified` (+ positional);
`value limit violations are translated to specific exception`; `create record
with pk as zero`; `charset`; `show nonexistent variable returns nil`.

## Acceptance criteria

- [ ] Un-skip the `adapter_test.rb` cluster (target the 40 matched-skips), batching
      sub-PRs ≤500 LOC by theme (exec_query result shape, remove_index arg forms,
      exception translation, prepared-statement update).
- [ ] `test:compare --cached --package activerecord` shows the adapter_test skip
      count drop to 0 (or the residue reclassified as permanent in `unported-files.ts`
      with a reason).
- [ ] Touched test files only (per CLAUDE.md — no full-suite run).

## Notes

Rails: `activerecord/test/cases/adapter_test.rb`. Some entries are backend-specific
(`charset`, `show … variable`) and may gate to MySQL/PG via `describeIf*`.
