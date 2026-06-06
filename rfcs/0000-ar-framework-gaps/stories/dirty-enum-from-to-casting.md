---
title: "Enum dirty from:/to: casting"
status: in-progress
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: ["dirty-parrot-virtual-attr-registry"]
deps-rfc: []
est-loc: 30
priority: 44
pr: 2975
claim: "2026-06-06T17:35:47Z"
assignee: "dirty-enum-from-to-casting"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. Rails matches label, symbol, and integer
forms in `attribute_changed?(from:, to:)`; trails compares the stored integer
only.

## Acceptance criteria

- [ ] `attribute_changed?(from:, to:)` matches enum label / symbol / integer
      forms (mirroring Rails enum dirty casting).
- [ ] Un-skips: `attribute_changed? properly type casts enum values` (1).

## Notes

Also needs the Parrot virtual fix (dep). Rails: `dirty_test.rb` enum case.
