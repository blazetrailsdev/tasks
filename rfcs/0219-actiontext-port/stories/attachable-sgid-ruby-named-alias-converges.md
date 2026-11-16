---
title: "Attachable's Ruby-named attachable_sgid alias converges"
status: draft
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionText::Attachable#read_attribute_for_serialization`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/attachable.rb:148-154`) forwards
`"attachable_sgid"` to `ActiveModel::Serialization#read_attribute_for_serialization`,
which is `send(key)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb`).
trails' `readAttributeForSerialization` (`packages/activemodel/lib/serialization.ts`) is
`rbFSend(this, key)`, and `sendInternal` does no snake→camel guessing, so
`packages/actiontext/lib/attachable.ts` carries a Ruby-named alias member
`attachable_sgid` (receipted `@noRailsEquivalent CONVERGEABLE` with this id) so the key
reaches `attachableSgid` unchanged (operator choice in the PR that closed
`attachable-sgid-super-forwards-key`).

## Acceptance criteria

- The `attachable_sgid` alias member on `Attachable` is deleted.
- `"attachable_sgid"` still reaches `attachableSgid` through a mechanism the operator
  rules on (e.g. a repo-wide rule for how a serialization key names a camelCase reader),
  without widening `sendInternal`'s name guessing.
- `packages/actiontext/test/unit/attachable.test.ts` stays green.
