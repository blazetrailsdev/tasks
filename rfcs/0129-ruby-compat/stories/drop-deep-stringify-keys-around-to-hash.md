---
title: "Drop the deep_stringify_keys three to_hash consumers insert"
status: done
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 7431
claim: "2026-09-03T02:25:21Z"
assignee: "drop-deep-stringify-keys-around-to-hash"
blocked-by: null
closed-reason: null
---

## Context

`hwia-to-hash-returns-ruby-compat-hash` made
`HashWithIndifferentAccess#toHash` answer `@blazetrails/ruby-compat`'s `Hash`
(`hash_with_indifferent_access.rb:376-381`), and `convert_value_to_hash`
(`:405-413`) recurses through it, so nested values are `Hash` too — exactly as
Ruby's nested values are `Hash`.

Four consumers need the plain-object spelling of that tree and get it by
inserting a `deep_stringify_keys` (`core_ext/hash/keys.rb:82-84`) that the
Rails body does NOT call:

- `packages/activerecord/src/store.ts:296-302` — `asRegularHash`, where
  `store.rb:295` is a bare `obj.to_hash` handed to the coder.
- `packages/activerecord/src/type/serialized.ts:34-44` — `unwrapHash`, whose
  comparison arms below only recognise plain objects and arrays.
- `packages/actionpack/src/action-dispatch/middleware/debug-view.ts:61-73` —
  `debug_hash` (`debug_view.rb:44-46`) is `object.to_hash.sort_by { ... }`.
- `packages/activesupport/src/message-pack/extensions.ts:200` — tracked
  separately by the `to_h` story, since that call site's real bug is calling
  `to_hash` at all.

Each is an added call, so each is a `parity:api:calls` divergence waiting to be
surfaced the moment its enclosing method is matched.

## Converged shape

Teach the three consumers to read a Ruby Hash in either trails spelling rather
than converting first — the same move `_deep_transform_keys_in_object` already
took in the merged PR, where Ruby's `when Hash` arm covers both. Concretely:
`isValueComparable` / `isPlainObject` in `serialized.ts` recognise a
`ruby-compat` `Hash`; `debugHash` sorts and inspects `Map` entries directly;
`asRegularHash` hands the coder whatever `to_hash` answered, with the coder
taught to dump a `Hash`. Then all three `deepStringifyKeys` calls are deleted,
not relocated.

## Acceptance criteria

- No `deepStringifyKeys` call remains at any of the three sites.
- `store.ts`'s `asRegularHash` is `obj.to_hash` call-for-call with
  `store.rb:295`.
- The store round-trip over a NESTED `HashWithIndifferentAccess`
  (`store.test.ts` "serialize stored nested attributes") still passes.
- `pnpm parity:api:calls` and `parity:api:calls:args` show no new rows.
