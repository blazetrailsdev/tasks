---
title: "symbolize_keys / deep_symbolize_keys answer a Hash, keeping to_hash's seat"
status: done
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 7411
claim: "2026-09-02T22:05:56Z"
assignee: "hwia-symbolize-keys-answers-a-hash"
blocked-by: null
closed-reason: null
---

## Context

`symbolize_keys` / `deep_symbolize_keys`
(`vendor/rails/activesupport/lib/active_support/hash_with_indifferent_access.rb:318-320`)
are `to_hash.symbolize_keys!` and `to_hash.deep_symbolize_keys!`. Ruby's
`symbolize_keys!` (`core_ext/hash/keys.rb:33-35`) is `transform_keys!` on a
Hash, which MUTATES the receiver and answers that same Hash — so Rails' answer
is a `Hash`, and `hash.default` survives the call.

`hwia-to-hash-returns-ruby-compat-hash` made `to_hash` answer
`@blazetrails/ruby-compat`'s `Hash`, but its two callers still answer a plain
object: `transformKeysBang`'s `Map` arm
(`packages/activesupport/src/hash-utils.ts:395-410`) builds a NEW plain object
rather than renaming in place, because a `Map` has no key-preserving in-place
rename, and `_deepTransformKeysInObjectBang`
(`hash-utils.ts:303-306`) routes a `Map` through the non-bang arm for the same
reason. So `HashWithIndifferentAccess#symbolizeKeys`
(`packages/activesupport/src/hash-with-indifferent-access.ts:736-738`) and
`deepSymbolizeKeys` (`:751-753`) answer `Record<string, unknown>` where Rails
answers a `Hash` — and the default the `to_hash` copy just received is dropped
on the floor.

A Ruby Symbol is a JS string in trails, so the key transform itself is the
identity; the whole of the deviation is the RETURN TYPE and the lost seat.

## Converged shape

`transformKeysBang`'s `Map` arm mutates the receiver — delete each key and
re-set it under `block(key)`, which for a `Map` preserves insertion order the
way Ruby's rehash does — and answers that same `Hash`. Same for
`_deepTransformKeysInObjectBang`. Then `symbolizeKeys(): Hash<string, unknown>`
and `deepSymbolizeKeys(): Hash<string, unknown>`, both `to_hash.*_bang(...)`
call-for-call.

Reaches ~45 `.symbolizeKeys()` / `.toOptions()` / `.deepSymbolizeKeys()` call
sites, every one of which reads the result as an object literal today; that is
the whole size of the story, exactly as the `toHash` migration was.

## Acceptance criteria

- `transformKeysBang` and `_deepTransformKeysInObjectBang` mutate and return a
  `Hash` receiver rather than downgrading it to a plain object.
- `symbolizeKeys` / `toOptions` / `deepSymbolizeKeys` answer a `Hash`, and the
  default the `to_hash` copy carries survives.
- Every call site is migrated; none reads the result as a plain object literal.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra:gate` show no new rows.
