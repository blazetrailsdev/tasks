---
rfc: "0006-collection-store-unification"
title: "Collection-store unification"
status: closed
created: 2026-05-29
updated: 2026-06-20
owner: "@deanmarano"
clusters: [activerecord, associations]
packages: [activerecord]
---

# RFC 0006 — Collection-store unification

## Summary

trails currently keeps has_many association data in **two** separate places: a
generic instance-level cache (`_cachedAssociations`) and the
`CollectionProxy`'s own target array. Rails keeps it in **one** place — the
association object's `@target`. This RFC proposes collapsing the two trails
stores into a single source of truth so we stop hand-syncing them.

## Motivation

Today the same logical data — "the loaded members of a has_many" — lives in two
stores that have to be kept in agreement by hand:

1. **`_cachedAssociations: Map<string, unknown>`** — an instance-level map on
   the record. It is written by the inverse-of preloader path
   (`preloader/association.ts:266-269`) and read by `Association#findTarget`
   (`association.ts:372`) and `instance-methods.ts:49`.
2. **`CollectionProxy._target: T[]` plus `_replacedOrAddedTargets: Set<T>`**
   (`collection-proxy.ts:145`) — written by `<<` / `push` / `concat` /
   `_addToTarget`.

Because the data is duplicated, every code path that mutates one store has to
remember to mutate the other. That sync is currently glued together by hand:
C2 (#2591) patched `_wireInverseAssociation` to seed
`proxy._replacedOrAddedTargets` from the preloader-populated cache. Rails has no
such seam — it never needs one, because there is a single `@target`.

What the split blocks: several skipped inverse-dedup tests in
`inverse-associations.test.ts`. The PRs that had to introduce or work around the
sync seam: #2591, #2633, #2643, #2650. Each one re-litigates the same problem of
"which store is authoritative, and did we update both?"

**Rails reference:**
`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb`
— see `@target`, `set_inverse_instance`, and `add_to_target`. The target array
is the only store; inverse wiring and preloading both write to it directly.

## Goals

- One source of truth for has_many loaded targets.
- Delete the hand-glued sync between `_cachedAssociations` and the proxy.
- Unblock the skipped inverse-dedup tests without adding new seams.
- Keep `api:compare` delta non-negative on the relevant Rails files.

## Non-goals

- Not touching belongs_to read semantics beyond what is needed to remove
  `_cachedAssociations` cleanly.
- Not changing any public API — `record.posts`, `record.posts << x`,
  `record.posts.length`, etc. behave exactly as before.

## Proposal

- Make `CollectionProxy` the single source of truth for has_many target data.
- Route inverse-wiring writes (the preloader path and every
  `set_inverse_instance` caller) through the proxy instead of writing to
  `_cachedAssociations`.
- Route `findTarget` reads (and the `instance-methods.ts:49` read) through the
  proxy.
- For has_one / belongs_to, **decide and document** one of:
  - **(A)** keep `_cachedAssociations` as a generic single-record cache for the
    singular associations only, now that has_many no longer uses it; or
  - **(B)** move the singular-association cache onto the singular association
    object (a `SingularAssociation`-style holder), mirroring Rails more closely
    and letting `_cachedAssociations` be deleted entirely.

  The story breakdown below assumes the long-term target is **(B)**, with **(A)**
  as the intermediate state after has_many is migrated. Story 4 chooses between
  finishing (B) and stopping at (A) based on the cost surfaced in Stories 2–3.

  **Update (2026-06-10):** S1–S3 shipped and S4 chose to **stop at (A)** — the
  cost of (B) (a singular holder + serialization moved onto the reader + ~150
  test-poke migrations across 13 files) exceeds one PR. The (B) convergence is
  now its own RFC, `0022-singular-association-holder` (stories b1–b5), which
  supersedes this RFC's (B) sketch and the original S4 "delete entirely" goal.
  This RFC stays `active` for its one remaining piece — the optional S5 (unskip
  inverse-dedup tests); all (B) convergence work tracks under the new RFC.

Story sketch (see `stories/` for the live breakdown):

- **S1 — proxy-backed read API**: introduce a read path on the proxy that
  returns loaded targets; keep `_cachedAssociations` as a deprecated shim that
  delegates to it.
- **S2 — migrate preloader writes**: route
  `preloader/association.ts:266-269` writes through the proxy.
- **S3 — migrate findTarget reads**: route `Association#findTarget` and
  `instance-methods.ts:49` reads through the proxy.
- **S4 — delete `_cachedAssociations`**: remove the map and clean up the six
  test pokes (or convert the shim to permanent internal API).
- **S5 (optional) — unskip dedup tests**: flip the skipped inverse-dedup tests
  now that the seam is gone.

## Constraints

- Test names match Rails verbatim — no test renames (trails `CLAUDE.md`).
- `api:compare` delta must be non-negative on the relevant Rails files.
- Six test files poke `_cachedAssociations` directly today. They must either be
  updated, or `_cachedAssociations` must survive as an internal proxy-backed
  method/accessor with the same shape and name so the pokes keep working. See
  Open questions.

## Open questions

- Should has_one / belongs_to also go through a `SingularAssociation`-style
  cache instead of `_cachedAssociations`? (Proposal option B.)
- Should the proxy read API be `record.association(name).cached?`-style or a
  plain getter? Pick whichever maps most cleanly to the Rails surface that
  `api:compare` checks.
- Does removing `_cachedAssociations` force rewrites of the six test files that
  poke it directly? CLAUDE.md forbids test renames; if removal would force
  rewrites, expose `record._associationCache(name)` as an internal shim with the
  same shape so the tests keep passing untouched.
