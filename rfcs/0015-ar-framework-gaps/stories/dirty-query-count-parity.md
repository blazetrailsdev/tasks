---
title: "No-op UPDATE / query-count parity"
status: done
updated: 2026-06-07
rfc: "0015-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 80
priority: 48
pr: 2984
claim: "2026-06-06T20:30:56Z"
assignee: "dirty-query-count-parity"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. trails skips no-op UPDATEs and emits
different txn/statement notifications than Rails, so exact query counts (6/0/3)
don't translate.

## Acceptance criteria

- [ ] Statement/txn emission on partial update matches Rails' counts (or the
      tests are re-expressed against trails' faithful semantics).
- [ ] Un-skips: `partial update`, `partial update with optimistic locking` (2).

## Notes

Lower yield + cross-cutting (notification/statement layer). Rails: `dirty_test.rb`
partial-update assertions.
