---
title: "Retire ordered-hash.ts's three invented members (toObject, mergeInPlace, shift)"
status: draft
updated: 2026-09-16
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced measuring `pnpm parity:api:extra --package activesupport` while porting
`test_reject!` in trails#7827.

`vendor/rails/activesupport/lib/active_support/ordered_hash.rb` defines exactly
six members on `ActiveSupport::OrderedHash` — `to_yaml_type` (`:25`),
`encode_with` (`:29`), `select` (`:33`), `reject` (`:37`),
`nested_under_indifferent_access` (`:41`) and `extractable_options?` (`:46`).
Everything else it answers is inherited from `::Hash` (`ordered_hash.rb:24`,
`class OrderedHash < ::Hash`).

`packages/activesupport/src/ordered-hash.ts` scores **3 novel, 10 moved**. The
ten moved are fine — they are Ruby core `Hash` members the extractor credits to
another file (`constructor`, `deleteIf`, `from`, `hasValue`, `inspect`, `invert`,
`merge`, `replace`, `toArray`, `update`), and that is also why `rejectBang`
correctly carries no `@noRailsEquivalent` receipt.

The three **novel** names have no Ruby counterpart anywhere and are trails
inventions:

- `toObject()` (`ordered-hash.ts:15`) — returns a `Record<string, V>`. Ruby has
  no such method; `to_h` is the nearest and is not this.
- `mergeInPlace()` (`ordered-hash.ts:76`) — Ruby's in-place merge is
  `Hash#update` / `Hash#merge!`, which the file already exposes as `update`.
- `shift()` (`ordered-hash.ts:99`) — Ruby core `Hash#shift` exists, but the
  extractor does not credit it, so either the port's shape has drifted from
  `vendor/ruby/hash.c`'s `rb_hash_shift` or the name needs a receipt.

## Converged shape

Each of the three is deleted, folded into the Ruby-named member that already
covers it (`mergeInPlace` into `update`), or — only where a Ruby core member
genuinely exists and the extractor cannot see it — given a
`@noRailsEquivalent PERMANENT` receipt naming the `vendor/ruby/...:LINE`. A
receipt is the fallback, not the default: a name with no Ruby counterpart at all
is invented surface and comes out.

Check call sites before deleting — `mergeInPlace` has at least one in-file
caller (`ordered-hash.ts:88`).

## Acceptance criteria

- `pnpm parity:api:extra --package activesupport` reports 0 novel for
  `ordered-hash.ts`, or each survivor carries a receipt citing a real
  `vendor/ruby` line.
- No caller is left calling a deleted name.
- `pnpm parity:api` delta non-negative; `pnpm parity:test` unchanged.
- Verify any receipt is not redundant by deleting it and re-measuring: a name the
  extractor scores `moved` needs none. See
  [[project-redundant-norailsequivalent-is-uncaught]].
