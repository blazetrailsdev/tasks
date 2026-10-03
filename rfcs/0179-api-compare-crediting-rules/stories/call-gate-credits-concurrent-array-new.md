---
title: "parity: an argument-less Concurrent::Array.new is ported as [] and charged an omitted new"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8447
claim: "2026-10-03T16:08:09Z"
assignee: "call-gate-credits-concurrent-array-new"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `call-gate-credits-argumentless-hash-new-as-a-literal`, which drops an
argument-less, block-less `Hash.new` / `Array.new` from call significance
(`core_new_kind`, `scripts/api-compare/extract-ruby-api.rb`; `isCoreNewWithNoNewExpression`,
`scripts/api-compare/compare.ts`). That rule reads a bare-constant receiver only, so it does not
cover `Concurrent::Array.new`, a `:const_path_ref`. Three receipts that named the Hash story sit on
exactly that shape and are re-pointed here:

- `packages/activerecord/src/core.ts` `connectedToStack` —
  `connected_to_stack = Concurrent::Array.new`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:220`), ported `connectedToStack = []`.
- `packages/activerecord/src/encryption/configurable.ts` `onEncryptedAttributeDeclared` —
  `self.encrypted_attribute_declaration_listeners ||= Concurrent::Array.new`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/configurable.rb:48`), ported `??= []`.
- `packages/activerecord/src/encryption/auto-filtered-parameters.ts` `collectForLater` —
  `@attributes_by_class[klass] ||= Concurrent::Array.new`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/auto_filtered_parameters.rb:49`),
  ported `this._attributesByClass.set(klass, [])`.

Two convergences are possible and the story has to pick one. `Concurrent::Map` is already ported as
a class (`packages/ruby-compat/src/concurrent/map.ts`), so a `Concurrent.Array` port beside it would
let the three bodies write `new Concurrent.Array()` and make the call. Or the gate treats an
argument-less `Concurrent::Array.new` as the literal `[]`, by widening `LITERAL_NEW_CONSTANTS` to a
`Concurrent::Array` path receiver.

## Acceptance criteria

- [ ] The three `@missingRailsCall new` receipts above are deleted, either because the bodies call a ported `Concurrent.Array` constructor or because the gate credits the literal.
- [ ] If the gate is widened: a Ruby-extractor test covers `Concurrent::Array.new` reading `literal-new`, and `Concurrent::Map.new` / `Concurrent::Array.new(x)` staying `const`.
- [ ] `pnpm parity:api:calls` green with no baseline row added.
