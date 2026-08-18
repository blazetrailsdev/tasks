---
title: "Move Relation#length onto the to: :records delegation mechanism"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6712
claim: "2026-08-18T19:07:41Z"
assignee: "red-5b0c3890"
blocked-by: null
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

## UNBLOCKED — verified end-to-end 2026-08-17

The blocker is gone. `precise-call-pairing-key-for-owner-static-and-accessor`
(PR #6659, merged 17:45 UTC) fixed the sibling-credit leak; this story's
`blocked-by` note was last written at 15:20 UTC and had never been re-checked
against it.

Re-ran the exact experiment the blocker described, on `main` at `origin/main`:

- moved `Relation#length` out of `relation.ts`'s class body into
  `RECORD_DELEGATES` in `relation/delegation.ts`
  (`length: (records) => records.length`), its faithful home per
  `vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101`'s
  `delegate :to_xml, :encode_with, :length, :each, … to: :records`
- declared `length(): Promise<number>` in the delegate declaration-merge block
  alongside `each` / `join` / `isIntersect`
- dropped the now-invalid `override` on `CollectionProxy#length`
  (`associations/collection-proxy.ts:382`) — the base no longer declares it as a
  class member. Rails overrides it there too (`load_target.length`), so the
  override itself stays, only the modifier goes.

Results, after a full `pnpm build` + `API_COMPARE_FORCE=1 pnpm parity:api --calls`:

- `pnpm typecheck` — clean
- **`call-mismatches ratchet: OK`** (1245 baselined, 910 unreviewed, 288 marks
  totalling 910 tight)
- **`call-args ratchet: OK`** (162 baselined shape rows)
- **`relation.ts` x `with_connection` rows in the fresh artifact: 0** — the three
  spurious rows this story was blocked on (`apply_join_dependency`,
  `create_or_find_by`, `to_sql`) do not appear
- `pnpm vitest run` over `relation.test.ts` + `src/relation/**`: 61 files,
  1203 passed / 36 skipped
- `relation/delegation.test.ts`, `relation/delegation.trails.test.ts`,
  `associations/collection-proxy.test.ts`: 3 files, 164 passed

The working tree was reverted after measuring — this story is claimed elsewhere
and the diff above is the whole change, reproduced from this note.
