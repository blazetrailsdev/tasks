---
title: "Move Relation#length onto the to: :records delegation mechanism"
status: blocked
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-08-17T13:10:28Z"
assignee: "assertions-activesupport-cluster-tail-2"
blocked-by: "Verified again on 2026-08-17: moving `length` into RECORD_DELEGATES/DelegationMethods (typecheck + relation, relation/delegation, collection-proxy suites all green) still reds `pnpm parity:api:calls` with two spurious rows in UNRELATED relation.ts methods — `create_or_find_by with_connection` and `to_sql with_connection`. Neither TS body calls withConnection or ever did; the credit leaked from length's presence in the class body. Baselining them would ratify pre-existing divergence in methods this story does not touch, so this stays blocked on precise-call-pairing-key-for-owner-static-and-accessor (0025-fidelity-verification-tooling; the merged story that now owns this, after the 2026-08-17 draft sweep closed call-credit-leaks-across-sibling-methods-in-a-class into it)."
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101` lists
`length` in the `delegate :to_xml, :encode_with, :length, :each, :join,
:intersect?, … to: :records` set. Every other member of that list is ported in
`packages/activerecord/src/relation/delegation.ts` — `RECORD_DELEGATES`
(the pure sync functions over a loaded `records` array) plus the matching
one-liner on `DelegationMethods`, which `relation.ts` mixes in via
`include(Relation, DelegationMethods)`.

`length` alone is still a hand-written body in `relation.ts` (`async length()`
→ `(await this.toArray()).length`), so the single `to: :records` mechanism has
one member missing and a reader cannot tell from the file that `length` is a
delegate rather than a Relation method of its own.

PR #6639 made this move and had to revert it: it turned four UNRELATED
`relation.ts` call-set rows red (`apply_join_dependency`, `create_or_find_by`,
`to_sql`, each losing a `with_connection` credit they should never have had).
That is a comparator defect, tracked as
`call-credit-leaks-across-sibling-methods-in-a-class`, not a reason to keep
`length` out of the mechanism.

## Converged shape

- `RECORD_DELEGATES.length = (records) => records.length`, positioned per
  delegation.rb:101's own argument order (`length` precedes `each`).
- `DelegationMethods.length()` as the one-liner over it, matching its siblings.
- Delete `Relation#length`'s class body; add `length(): Promise<number>;` to
  the `export interface Relation<T extends Base>` declaration merge in
  `relation.ts` (the block that already declares `each` / `join` / `compact`),
  so `CollectionProxy#length`'s `override` (collection-proxy.ts, its own
  `load_target` path per collection_proxy.rb) still typechecks.

Verified during #6639: with those edits `pnpm typecheck` and the relation /
delegation / collection-proxy suites pass; only the call-set rows above block.

## Acceptance criteria

- `length` resolves through `RECORD_DELEGATES` / `DelegationMethods`; no
  `length` body remains in `relation.ts`.
- `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- relation, `relation/delegation` and `collection-proxy` suites pass unchanged.

## Dependencies

Blocked on `call-credit-leaks-across-sibling-methods-in-a-class`
(0025-fidelity-verification-tooling).
