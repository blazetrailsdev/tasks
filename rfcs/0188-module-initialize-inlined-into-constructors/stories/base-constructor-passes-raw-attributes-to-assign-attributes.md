---
title: "base-constructor-passes-raw-attributes-to-assign-attributes"
status: in-progress
updated: 2026-10-20
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9134
claim: "2026-10-20T13:59:21Z"
assignee: "base-constructor-passes-raw-attributes-to-assign-attributes"
blocked-by: null
closed-reason: null
---

## Context

`Base`'s constructor (`packages/activerecord/src/base.ts`, the `Core#initialize` segment) reassigns `attributes` before `super(null)`. It runs `isEmpty` / `sanitizeForMassAssignment`, then `_extractAssociationAttrs` pulls the association keys out, and `_dispatchAssociationAttrs` applies them after the assignment. Rails passes the raw `attributes` straight to `assign_attributes` at the `super` position (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`, `activemodel/lib/active_model/api.rb:80-84`). Sanitizing happens inside `assign_attributes` (`activemodel/lib/active_model/attribute_assignment.rb`), and association writers are reached through `_assign_attribute`'s `public_send`. Raised in review on trails#9075.

## Acceptance criteria

- `Base`'s constructor passes `attributes` unmodified to `assignAttributes` where Rails calls `super`. `_extractAssociationAttrs` / `_dispatchAssociationAttrs` are removed, or folded into the Rails path that association writers take.
