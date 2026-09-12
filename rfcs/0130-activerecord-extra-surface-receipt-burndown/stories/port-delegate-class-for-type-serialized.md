---
title: "port-delegate-class-for-type-serialized"
status: done
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7728
claim: "2026-09-12T15:45:25Z"
assignee: "port-delegate-class-for-type-serialized"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type::Serialized` is `class Serialized < DelegateClass(ActiveModel::Type::Value)`
(`vendor/rails/activerecord/lib/active_record/type/serialized.rb:5`). trails had no
`DelegateClass`, so `Serialized` subclassed `ValueType` outright and hand-wrote two of the
forwarders Ruby generates (`type()`, `isBinary()`), while everything else — `deterministic?` on a
`Serialized(EncryptedAttributeType)`, the whole inherited `Value` API — either did not forward at
all or was worked around at the call site.

Ruby's `DelegateClass(superclass)` (`vendor/ruby/lib/delegate.rb:394-443`) has two halves and both
are needed here:

- `define_method(method, Delegator.delegating_block(method))` for every public and protected
  instance method of `superclass` (`:406-418`), so a name `superclass` declares reaches
  `__getobj__` instead of running `superclass`'s own body against the wrapper.
- `Delegator#method_missing` (`:82-93`), inherited by the generated class, which forwards any other
  name the delegate answers.

Plus `Delegator#initialize` (`:75-77`) and the generated `__getobj__` / `__setobj__` (`:398-408`,
with the `"cannot delegate to self"` `ArgumentError` at `:197`).

The motivating call site is `packages/activerecord/src/type/serialized.ts` —
`export class Serialized extends DelegateClass(ValueType)` with `super(subtype)`, mirroring the Ruby
line for line. `Tempfile` (`packages/ruby-compat/src/tempfile.ts:85`) is a second Ruby
`DelegateClass(File)` already in the repo, currently standing on `methodMissingProxy` alone (the
`method_missing` half only) — it can converge onto this primitive by its own story.

Filed under RFC 0130 rather than RFC 0129: 0129 and its successor 0138 are both closed, and the
work is a receipt burndown for activerecord — it retires `Type::Serialized#type()`'s
`api-compare-nulls-a-delegateclass-superclass` receipt and `encryptedTypeOf`'s. The ruby-compat mark
bump below is the reviewed line that
`scripts/api-compare/extra-surface-mark.ts`'s module comment allows for a new MRI name with a
motivating call site.

## Acceptance criteria

- `packages/ruby-compat/src/delegate.ts` exports `DelegateClass`, carrying both halves plus
  `Delegator#initialize` / `__getobj__` / `__setobj__`, cited to `vendor/ruby/lib/delegate.rb`.
- `Type::Serialized` consumes it; its two hand-written forwarders and their receipts are deleted.
- `ruby-compat`'s `total` mark rises 59 → 60 for the one new public name, which carries a
  `@noRailsEquivalent PERMANENT` receipt so `novel` stays 0 (the reviewed-line allowance in
  `scripts/api-compare/extra-surface-mark.ts`'s module comment).
