---
title: "Public attribute_will_change! API"
status: done
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 42
pr: 2977
claim: "2026-06-06T16:50:27Z"
assignee: "dirty-attribute-will-change-api"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. Only the internal `attributeWillChangeBang`
dispatch exists; Rails exposes a public instance-level `attribute_will_change!`
(force-dirty).

## Acceptance criteria

- [ ] Public `attribute_will_change!` (force-mark an attribute dirty) on the
      model instance, mirroring `ActiveModel::Dirty#attribute_will_change!`.
- [ ] Un-skips: `virtual attribute will change`,
      `attribute_will_change! doesn't try to save non-persistable…`,
      `virtual attributes are not written with partial_writes off` (3).

## Notes

Rails: `active_model/dirty.rb`.
