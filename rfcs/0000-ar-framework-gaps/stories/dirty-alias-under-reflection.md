---
title: "Alias dirty under reflection"
status: claimed
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 30
priority: 46
pr: null
claim: "2026-06-06T19:30:56Z"
assignee: "dirty-alias-under-reflection"
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
