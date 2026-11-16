---
title: "Attachable#read_attribute_for_serialization's attachable_sgid arm forwards key unchanged to super"
status: done
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10187
claim: "2026-11-16T16:06:41Z"
assignee: "attachable-sgid-super-forwards-key"
blocked-by: null
closed-reason: null
---

## Context

`ActionText::Attachable#read_attribute_for_serialization`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/attachable.rb:148-154`) calls a bare `super` in its
`attachable_sgid` arm, so `key` reaches `ActiveModel::Serialization#read_attribute_for_serialization`
(`send(key)`) unchanged. trails#10171 has `packages/actiontext/lib/attachable.ts:29` pass
`"attachableSgid"` to `rbCallSuper` instead, because `rbFSend(this, "attachable_sgid")` finds no
member. `parity:api:calls:args` does not see the changed argument.

## Acceptance criteria

- The `attachable_sgid` arm calls `rbCallSuper(this, readAttributeForSerialization, key)` with `key` unchanged, as Rails does.
- `"attachable_sgid"` reaches `attachableSgid` through a direct spelling or registry owned by actiontext. ActiveModel gets no knowledge of the key, and `sendInternal`'s name guessing is not widened (CLAUDE.md § "A dispatch by name is spelled directly").
- `packages/actiontext/test/unit/attachable.test.ts` "attachable_sgid is included in as_json when only option is nil or includes attachable_sgid" still passes.
