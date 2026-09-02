---
title: "Give rb_hash_update's conflict block the same marker fetch's block arm uses"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7394 ported both of MRI's block-taking Hash arms, and they ended up
detecting the block two DIFFERENT ways in the same file
(`packages/ruby-compat/src/hash.ts`):

- `fetch` (`rb_hash_fetch_m`, `vendor/ruby/hash.c:2176`) uses an explicit
  marker: `block(fn)` brands the function with a `Symbol.for` key and
  `blockGivenP` reads it back. The marker is forced there — `fetch`'s block arm
  and its two-argument DEFAULT arm share argument position 3, and a stored
  default may itself be callable, so `typeof x === "function"` cannot separate
  them.
- `update` / `mergeBang` / `merge` (`rb_hash_update`, `hash.c:4028`; the block
  body is `rb_hash_update_block_i`, `hash.c:4012-4022`) sniff instead:
  `typeof others[others.length - 1] === "function"`. That is safe TODAY only
  because `others` is typed `Record<string, T> | ConflictBlock<T>` and a Ruby
  Hash argument is never a function.

MRI has no such split: `rb_hash_update` and `rb_hash_fetch_m` both dispatch on
the SAME `rb_block_given_p()` (`vendor/ruby/eval.c:866`). Two spellings for one
Ruby construct is the shape CLAUDE.md's "Ruby kwargs, blocks, and
`method_missing` each have a settled trails idiom — find it and use it; don't
invent a new shape" rule exists to prevent, and the sniff is the arm that breaks
the moment anything else in ruby-compat grows a value-or-block position.

## Converged shape

One block idiom for the package: `update` / `mergeBang` / `merge` take the
marked block too, so every ruby-compat body that mirrors an
`rb_block_given_p()` dispatch reads the mark rather than the value's type. The
`ConflictBlock<T>` type stays — it is the block's SIGNATURE
(`key, oldValue, newValue`, MRI's yield order at `hash.c:4012-4022`) — and gains
the brand, the way `Block<T>` carries `fetch`'s.

The one call site to carry through is
`packages/actionpack/src/action-controller/metal/strong-parameters.ts ::
reverseMergeBang`, which mirrors `strong_parameters.rb:1043`
(`@parameters.merge!(other_hash.to_h) { |key, left, right| left }`) and must
keep its receiver-wins semantics — the `hash.trails.test.ts` collision case and
the actioncontroller suite both pin that.

Consider at the same time whether `Block<T>`'s `(key: string) => T` shape should
generalise, since a conflict block is arity 3: one brand, two signatures, rather
than a second brand.

## Acceptance criteria

- `update` / `mergeBang` / `merge` detect their conflict block by the mark, not
  by `typeof === "function"`; `blockGivenP` is the single reader in the file.
- `reverseMergeBang` still mirrors `strong_parameters.rb:1042-1046` exactly and
  its `reverse_merge! -> merge!` row stays absent from
  `scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/strong-parameters.json`.
- The existing `hash.trails.test.ts` collision and blockless cases pass
  unchanged; the actioncontroller suite green.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate`
  green, with ruby-compat's `novel` still 0 — any new exported name carries a
  `@noRailsEquivalent PERMANENT` receipt citing `rb_block_given_p`
  (`vendor/ruby/eval.c:866`).
