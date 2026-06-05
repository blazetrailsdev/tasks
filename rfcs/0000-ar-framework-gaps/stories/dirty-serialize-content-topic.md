---
title: "serialize :content on canonical Topic (+ schema)"
status: ready
updated: 2026-06-04
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 60
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. The canonical `Topic` model needs
`serialize :content` (+ the schema column) for the serialized-attribute dirty
tests. Shared-model change.

## Acceptance criteria

- [ ] Canonical `Topic` declares `serialize("content")` with the backing column.
- [ ] Un-skips: `save should store serialized attributes…`,
      `save always should update timestamps…`,
      `save should not save serialized attribute…`,
      `changes to save should not mutate array of hashes` (4).

## Notes

The last test also needs ActiveSupport `travel` (time helper). Rails:
`dirty_test.rb` serialized-attribute cases.
