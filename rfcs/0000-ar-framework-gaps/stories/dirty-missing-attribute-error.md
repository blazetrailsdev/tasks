---
title: "MissingAttributeError on unselected access"
status: in-progress
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 47
pr: 2980
claim: "2026-06-06T20:15:56Z"
assignee: "dirty-missing-attribute-error"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `Person.select(:id).first.first_name`
returns `undefined` instead of raising — Rails raises `MissingAttributeError`
for attributes not in the SELECT.

## Acceptance criteria

- [ ] Accessing an unselected attribute raises `MissingAttributeError`
      (mirroring Rails).
- [ ] Un-skips: `attributes not selected are still missing after save` (1).

## Notes

Rails: `ActiveModel::MissingAttributeError`.
