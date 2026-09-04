---
title: "_deep_transform_keys_in_object answers self.class.new, not a plain object"
status: in-progress
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 13
pr: 7486
claim: "2026-09-04T16:20:47Z"
assignee: "sqlite3-and-mysql-bare-missing-rails-call-receipts"
blocked-by: null
closed-reason: null
---

## Context

`hwia-symbolize-keys-answers-a-hash` (#7411) converged the BANG side: a `Map`
receiver — the trails spelling of a Ruby Hash that
`HashWithIndifferentAccess#toHash` answers — is now renamed in place by
`transformKeysBang` and `_deepTransformKeysInObjectBang`, which answer that same
receiver, mirroring `_deep_transform_keys_in_object!`'s
`object.keys.each { value = object.delete(key); object[yield(key)] = ... }`
(`vendor/rails/activesupport/lib/active_support/core_ext/hash/keys.rb:129-138`).

The NON-bang twin was left behind. Ruby's `_deep_transform_keys_in_object`
(`keys.rb:116-125`) is

```ruby
object.each_with_object(self.class.new) do |(key, value), result|
  result[yield(key)] = _deep_transform_keys_in_object(value, &block)
end
```

— `self.class.new`, so the answer is a Hash of the RECEIVER's class, carrying a
Hash seat. trails' `_deepTransformKeysInObject`
(`packages/activesupport/src/hash-utils.ts:296-317`) routes its `Map` arm
through `const result: AnyObject = {}` instead, so a `Hash` receiver is
downgraded to a plain object and its `default` / `defaultProc` are dropped —
exactly the deviation the bang side just retired.

`stringifyKeysBang` (`hash-utils.ts:208-210`) and `deepStringifyKeysBang`
(`:275-277`) are the other half of the same gap: both are still typed
`AnyObject` only, so a `Hash` receiver cannot reach them at all even though
`transformKeysBang` and `deepTransformKeysBang` now answer one.

## Converged shape

- `_deepTransformKeysInObject`'s `Map` arm builds a `Hash` — Ruby's
  `self.class.new`, so a `HashWithIndifferentAccess` receiver answers one of
  those and a plain `Hash` answers a plain `Hash` — and recurses as it does
  today.
- `stringifyKeysBang` / `deepStringifyKeysBang` carry the receiver-typed `Map`
  overload their symbolize twins got in #7411
  (`<T extends Map<string, unknown>>(hash: T): T`).
- Migrate whatever call sites the return-type change reaches, the way #7411 did
  for the bang side.

## Acceptance criteria

- `_deepTransformKeysInObject`'s `Map` arm answers a `Hash`, not a plain object,
  and the receiver's seat survives.
- `stringifyKeysBang` / `deepStringifyKeysBang` accept and answer a `Hash`
  receiver.
- No call site reads either result as a plain object literal.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra:gate` show no new rows.
