---
title: "serialization-reads-snake-case-serialization-keys"
status: draft
updated: 2026-11-15
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

# `read_attribute_for_serialization` cannot reach a snake_case serialization key

## Context

- `ActiveModel::Serialization#read_attribute_for_serialization` is `send(key)`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb`); trails ports it as
  `rbFSend(this, key)` (`packages/activemodel/lib/serialization.ts:134`).
- `ActionText::Attachable` adds the key `"attachable_sgid"`
  (`vendor/rails/v8.0.2/actiontext/lib/action_text/attachable.rb:144-154`). It has to stay snake_case,
  because `@rails/actiontext` reads `attachable_sgid` from the direct-upload JSON. Its `super`
  arm sends `"attachable_sgid"`, and no TS member answers that name (`attachableSgid`).
- trails#10151 calls `this.attachableSgid()` directly in that arm, receipted
  `@missingRailsCall super — CONVERGEABLE serialization-reads-snake-case-serialization-keys`
  (`packages/actiontext/lib/attachable.ts`).

## Acceptance criteria

- A serialization key's reader can be reached from its Ruby spelling without widening
  `sendInternal`'s name guessing. CLAUDE.md § "A dispatch by name is spelled directly" rules
  that out, so the fix is a direct spelling or registry in serialization.
- `Attachable#readAttributeForSerialization` calls `super` in both arms, as Rails does, and the receipt is gone.
- `DirectUploadsController#create` for a blob still answers `attachable_sgid` in its JSON.
