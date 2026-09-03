---
title: "Route LazyAttributeHash's each_value and fetch through ruby-compat, and keep deep_dup's materialized flag"
status: in-progress
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7437
claim: "2026-09-03T11:20:50Z"
assignee: "resweep-rfc-0104-story-context-against-main"
blocked-by: null
closed-reason: null
---

## Context

`LazyAttributeHash` is `delegate :transform_values, :each_value, :fetch,
:except, to: :materialize` (`activemodel/lib/active_model/attribute_set/builder.rb:95`)
— four Ruby Hash methods, so each TS body should be the ruby-compat export over
`this.materialize()` and nothing else.

PR #7383 converged one of the four: `except` is now
`except(this.materialize(), ...names)`, which is both the delegation Rails
writes and the fix for a `__proto__` key the open-coded loop dropped. The other
three are still open-coded in
`packages/activemodel/src/attribute-set/builder.ts`:

- `transformValues` calls the ruby-compat export already, so only its name is
  in question — it is fine.
- `eachValue` spells `for (const attr of Object.values(...))` where
  ruby-compat has `eachValue` / `eachPair` (`vendor/ruby/hash.c:3149`).
- `fetch` spells a `hasKey` probe and its own `KeyError` where ruby-compat's
  `fetch` (`vendor/ruby/hash.c:2176`) already has both arms, including the
  `rb_str_ellipsize` message.

Separately, `deep_dup` (`builder.rb:114-118`) is `dup.tap { |copy| copy
.instance_variable_set(:@delegate_hash, …) }`: Ruby's `dup` carries `@values`,
`@types` AND `@materialized` over, and `initialize_dup` (`builder.rb:120-123`)
re-copies the delegate hash. The TS body constructs a fresh
`LazyAttributeHash` instead, so the copy starts `materialized = false` where
Ruby's starts from the receiver's flag. Harmless today — re-materializing is
idempotent, since every key is already in the delegate — but it is a state
divergence in a ported body, not a language shortcoming.

## Converged shape

`eachValue` and `fetch` are one call each to the matching ruby-compat export
over `this.materialize()`. `deepDup` copies the receiver's own state rather
than rebuilding it, so `materialized` survives the copy the way Ruby's `dup`
carries it.

## Acceptance criteria

- `eachValue` and `fetch` are single delegating calls; the hand-rolled
  `KeyError` throw is gone.
- `deepDup` preserves the receiver's `materialized` flag.
- `pnpm parity:api:calls` / `:ruby-compat` non-negative — this should shrink
  the reverse population, not grow it.
- activemodel green.
