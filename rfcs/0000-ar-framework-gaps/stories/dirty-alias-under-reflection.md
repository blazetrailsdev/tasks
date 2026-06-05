---
title: "Alias dirty under reflection"
status: ready
updated: 2026-06-04
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 30
priority: 46
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `aliasAttribute` over a reflected column:
`parrot.name =` updates the value but doesn't mark it changed. Non-aliased
reflected columns track fine.

## Acceptance criteria

- [ ] Assigning through an `aliasAttribute` of a reflected column marks the
      underlying attribute dirty.
- [ ] Un-skips: `aliased attribute changes` (1).

## Notes

Rails: alias_attribute dirty propagation.
