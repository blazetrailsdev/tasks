---
title: "Delete AbstractController::Base#availableActions in favour of the Rails action_methods reader"
status: claimed
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-06T12:39:40Z"
assignee: "abstract-controller-drops-invented-available-actions"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8507, which added the Rails instance reader
`AbstractController::Base#action_methods`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:172-174`,
`self.class.action_methods`) to
`packages/actionpack/src/abstract-controller/base.ts`.

The same class still carries `availableActions()`, an invented instance method
with the identical body, and lists `"availableActions"` in the hand-written
`_internalMethods` set. Rails has no `available_actions`; `parity:api:extra`
scores it as extra surface on `abstract-controller/base.ts`.

## Acceptance criteria

- `availableActions` is deleted and its callers use `actionMethods()`.
- Its `_internalMethods` entry is removed.
