---
title: "HashWithIndifferentAccess#to_hash returns ruby-compat's Hash, so set_defaults has a seat to land in"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-hash-dig-and-plain-object-default-seat` adjudicated RFC 0023's
`plain-object-has-no-hash-default-seat` and found the seat gap is real but
cannot be closed where the JSDoc notes sit. Two facts settle it:

- Trails ALREADY has the seat everywhere Rails' `set_defaults` writes to an
  ActiveSupport receiver. `HashWithIndifferentAccess` carries `_default` /
  `_defaultProc` (`packages/activesupport/src/hash-with-indifferent-access.ts:66-67`),
  and its `dup` (`hash_with_indifferent_access.rb:264-268`) and `sliceBang`
  (`:366-369` → `core_ext/hash/slice.rb:13-14`) both copy them —
  `hash-with-indifferent-access.ts:447-455` is line-for-line with the Ruby.
- The two remaining sites are the ones that return a **plain object**:
  `HashWithIndifferentAccess#toHash` (`hash_with_indifferent_access.rb:375-381`,
  ours at `hash-with-indifferent-access.ts:779-785`) and the free
  `sliceBang` over a `Record` (`packages/activesupport/src/core-ext/hash/slice.ts:14`).
  Rails' `to_hash` returns a regular `Hash`, which HAS a seat, so
  `set_defaults(copy)` has somewhere to land. A JS object literal does not.

`@blazetrails/ruby-compat`'s `Hash extends Map`
(`packages/ruby-compat/src/hash.ts`) is the seat, and it shipped with
`default` / `setDefault` / `defaultProc` / `setDefaultProc` and a `get` whose
miss path runs the proc. So the convergence is mechanical and known:
`toHash(): Hash<string, V>` instead of `AnyObject`. What it is not is small —
`grep -rn '\.toHash()' packages/` is 102 call sites, every one of which reads
the result as an object literal (`obj[key]`, `Object.keys`, spread), and a
`Map` subclass answers none of those. That is the whole of this story, and it
is why the adjudicating PR did not take it.

The free `sliceBang` is the smaller half and rides along: once `toHash`
returns a `Hash`, `sliceBang` over one copies the seat the way
`slice.rb:13-14` does, and its `Record` arm keeps today's behaviour for the
one plain-object call site (`activemodel/src/validations/validates.ts:45`,
an options hash with no seat).

## Acceptance criteria

- `HashWithIndifferentAccess#toHash` returns `ruby-compat`'s `Hash` and runs
  the `set_defaults` copy of `hash_with_indifferent_access.rb:379`.
- Every `.toHash()` call site is migrated; none reads the result as a plain
  object literal.
- `sliceBang` copies `default` / `default_proc` for a `Hash` receiver
  (`core_ext/hash/slice.rb:13-14`) and the JSDoc gap note in
  `packages/activesupport/src/core-ext/hash/slice.ts` is deleted rather than
  reworded.
- `packages/ruby-compat` still has no `dependencies` block; the direction of
  the edge stays activesupport → ruby-compat.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra:gate` show no new rows; activesupport and all three AR
  lanes green.
- If the migration does not fit one PR, split it by consumer package, each PR
  from `main` with non-overlapping files.
