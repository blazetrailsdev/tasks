---
title: "Custom attribute-type changed_in_place? hook"
status: claimed
updated: 2026-06-07
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 60
priority: 52
pr: null
claim: "2026-06-07T01:30:56Z"
assignee: "dirty-custom-changed-in-place-hook"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. No equivalent instrumentation hook today
for a custom attribute type's `changed_in_place?` on anonymous classes.

## Acceptance criteria

- [ ] Custom attribute types can define a `changed_in_place?` hook consulted by
      dirty tracking (mirroring Rails `ActiveModel::Type::Value#changed_in_place?`).
- [ ] Un-skips: `attribute_changed? doesn't compute in-place changes for
unrelated attributes` (1).

## Notes

Rails: `active_model/type/value.rb#changed_in_place?`.
