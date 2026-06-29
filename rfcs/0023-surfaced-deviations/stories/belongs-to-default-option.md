---
title: "belongs_to: default: proc option not implemented"
status: in-progress
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4266
claim: "2026-06-29T12:22:10Z"
assignee: "belongs-to-default-option"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb` — `test_default` and `test_default_with_lambda`: Rails supports `default:` proc/value on `belongs_to` to set the association when the FK is nil. Trails has no equivalent. Surfaced in PR #4209 (both tests marked `.todo`).

Rails: `belongs_to :firm, default: -> { Firm.first }`

## Acceptance criteria

- `belongsTo("firm", { default: () => Firm.first() })` is supported.
- When a new record is instantiated with no FK set, the default proc fires and populates the association.
- `default` and `default with lambda` tests pass (un-todo).
