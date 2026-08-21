---
title: "Retire the encryption decorator's idempotence guard and its registerEncryptedType seed"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6803
claim: "2026-08-21T02:40:24Z"
assignee: "retire-the-encryption-decorator-idempotence-guard"
blocked-by: null
closed-reason: null
---

## Context

Rails' encryption decorator is four lines with no idempotence guard
(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:87-92`):

```ruby
decorate_attributes([name]) do |name, cast_type|
  scheme = scheme_for(...)
  ActiveRecord::Encryption::EncryptedAttributeType.new(
    scheme: scheme, cast_type: cast_type, default: columns_hash[name.to_s]&.default)
end
```

It needs none: `_default_attributes` seeds a fresh set and applies each queued
modification once, so `cast_type` is never already an
`EncryptedAttributeType`.

trails' block opens with one
(`packages/activerecord/src/encryption/encryptable-record.ts`, in
`pushEncryptionDecorator`):

```ts
if (castType instanceof EncryptedAttributeType) return null as unknown as Type;
```

It is load-bearing for a second trails-only path: `registerEncryptedType`
(same file) writes a built `EncryptedAttributeType` straight into
`_attributeDefinitions`, and ActiveRecord's `_default_attributes` seeds cast
types from that map — so the replay can be handed an already-wrapped type and
would double-wrap without the guard. Rails has no `register_encrypted_type`:
`encrypt_attribute` only pushes the decorator.

PR #6791 retired `decorateAttributes`' eager `_attributeDefinitions` bake, so the
guard's original justification (the eager pass re-wrapping a decorated view) is
already gone; what remains is the `registerEncryptedType` seed.

## Converged shape

`encryptAttribute` pushes the decorator and nothing else, as
encryptable_record.rb:87-92 does. `registerEncryptedType` — the "plain mock
model" path for callers without `decorateAttributes` — goes away or stops
writing an encrypted type into `_attributeDefinitions`, and every consumer
reads the encrypted type through `type_for_attribute`
(activemodel/lib/active_model/attribute_registration.rb:43-51), which is where
the replayed decorator puts it. With no encrypted type in the seed, the
idempotence guard has nothing to guard and comes out too.

## Acceptance criteria

- The `castType instanceof EncryptedAttributeType` early return is gone from
  the decorator.
- `registerEncryptedType` no longer writes into `_attributeDefinitions` (or is
  deleted, if its callers can take the declaration path).
- Remaining readers of an encrypted type resolve it through
  `typeForAttribute` / `attributeTypes`, not `_attributeDefinitions` — see
  `getAttributeType` and `encryption/test-helpers.ts` in the same package.
- The whole `packages/activerecord/src/encryption` suite stays green, including
  `encryption-schemes.test.ts` and `extended-deterministic-queries.test.ts`,
  which still read `_attributeDefinitions.get(name).type`.
