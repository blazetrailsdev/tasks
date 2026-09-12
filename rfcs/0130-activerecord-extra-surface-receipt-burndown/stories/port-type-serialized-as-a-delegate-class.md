---
title: "port-type-serialized-as-a-delegate-class"
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
claim: "2026-09-12T15:45:23Z"
assignee: "port-type-serialized-as-a-delegate-class"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type::Serialized` is `class Serialized < DelegateClass(ActiveModel::Type::Value)`
(`vendor/rails/activerecord/lib/active_record/type/serialized.rb:5`), so every method it does not
define itself is forwarded to its `subtype`. trails' `Type::Serialized`
(`packages/activerecord/src/type/serialized.ts`) is a plain `ValueType` subclass with no such
forwarding.

That gap is load-bearing for encryption. Rails' `deterministic_encrypted_attributes`
(`encryption/encryptable_record.rb:58-62`) and `encrypted_attribute?` (`:150-153`) read the
`EncryptedAttributeType` straight off `type_for_attribute(name)` and call `deterministic?` /
`encrypted?` on it — correct even when `serialize` decorated the attribute after `encrypts`
(`test/models/traffic_light_encrypted.rb:10-16`, `test/cases/encryption/encryptable_record_test.rb:95`),
because DelegateClass forwards those down. So does
`EncryptedQuery.process_arguments` (`encryption/extended_deterministic_queries.rb:58-63`).

trails stands in for that delegation with `encryptedTypeOf`
(`packages/activerecord/src/encryption/encryptable-record.ts`), which walks `subtype` / `castType`
looking for the `EncryptedAttributeType`. It carries
`@noRailsEquivalent CONVERGEABLE port-type-serialized-as-a-delegate-class` and has four callers:
`deterministicEncryptedAttributes`, `encryptedAttribute`, and two sites in
`encryption/extended-deterministic-queries.ts`.

Split out of `encryption-converge-pending-encryptions-to-decorate-attributes` (trails#PENDING),
which converged `encrypts` onto `decorate_attributes` and deleted `applyPendingEncryptions` /
`_pendingEncryptions`, but could not delete `encryptedTypeOf`: reading `typeForAttribute` directly
reds `extended-deterministic-queries.trails.test.ts` ("raises Psych::DisallowedClass when a previous-scheme
candidate reaches the YAML coder" and its sibling) because the `Serialized` wrapper answers neither
`deterministic` nor `isEncrypted`.

## Acceptance criteria

- `Type::Serialized` forwards unhandled members to its `subtype`, the way
  `DelegateClass(ActiveModel::Type::Value)` does at `serialized.rb:5`.
- `encryptedTypeOf` is deleted; its four callers read `typeForAttribute(name)` directly, as at
  `encryptable_record.rb:60,152` and `extended_deterministic_queries.rb:60`.
- The receipt `@noRailsEquivalent CONVERGEABLE port-type-serialized-as-a-delegate-class` is removed
  and the extra-surface mark tightened.
