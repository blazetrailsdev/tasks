---
title: "hasone-through-write-side-and-nil-stale-gaps"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4469
claim: "2026-07-03T03:09:55Z"
assignee: "hasone-through-write-side-and-nil-stale-gaps"
blocked-by: null
---

## Context

Surfaced while porting `has-one-through-associations.test.ts` to a faithful
Rails mirror (RFC 0048, `redo-has-one-through-faithful-port`). Several
write-side / stale-target has_one_through behaviors that Rails supports are
unimplemented in trails; the ported tests are `it.skip` with
`TRACKED-PENDING-CONVERGENCE` markers pointing here.

trails source: `packages/activerecord/src/associations/has-one-through-association.ts`
Rails: `vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`

- `singular_association.rb` (`build`, `create`) and `through_association.rb`.

Distinct gaps (each has a skipped test):

1. **`build` does not build/persist the join record.**
   `member.association("club").build()` sets the club target but never builds
   the intermediate through record (`current_membership`); it stays nil even
   after `member.save()`. Rails' `build_club` builds `current_membership` too.
   Tests: `creating association builds through record`,
   `association build constructor builds through record`.

2. **`create` does not route through `createThroughRecord`.**
   `member.association("club").create()` returns a target with a bogus id and
   persists no join record. Test:
   `association create constructor creates through record`.

3. **New-owner assignment does not autosave the target.**
   On a new owner, saving a has_one_through assignment creates the join record
   but leaves the target unsaved (`club.id` nil). Tests:
   `creating association builds through record for new`,
   `creating association sets both parent ids for new`.

4. **Stale reload after a nil target load.**
   After a has_one_through belongs_to loads a nil target, `_staleState` is null
   and the reader's stale-reload branch is guarded by `_staleState != null`
   (`association.ts:381`), so setting the through FK never reloads the
   previously-nil target. Test:
   `has one through belongs to setting belongs to foreign key after nil target loaded`.

5. **Unpersisted-owner read via in-memory through target.**
   A has_one_through read on an unpersisted owner whose through belongs_to
   target is already persisted does not resolve via the in-memory through
   record. Test: `loading cpk association with unpersisted owner`.

Note: this PR already fixed the sibling gap — `HasOneThroughAssociation` now
overrides `staleState` (via `throughStaleState`), so
`test_has_one_through_belongs_to_should_update_when_the_through_foreign_key_changes`
and `test_cpk_stale_target` pass. Item 4 above is the remaining nil-load edge.

## Acceptance criteria

- [ ] Converge trails to Rails for each numbered gap (build/create construct the
      through record; new-owner assignment autosaves the target; nil-load stale
      reload; unpersisted-owner in-memory resolution).
- [ ] Un-skip the corresponding `TRACKED-PENDING-CONVERGENCE` tests in
      `has-one-through-associations.test.ts` (names unchanged).
- [ ] No regression in has_one_through / has_many_through / nested-through suites.

## PG/MariaDB-only gaps (surfaced by PR #4375 CI)

Two more `it.skip` tests in the same file — these pass on SQLite but fail
deterministically (reproduced in isolation) on PostgreSQL and MariaDB:

1. **has_one autosave does not persist a lone has_one child on `owner.save()`.**
   `member.association("memberDetail").writer(md); await member.save()` leaves
   `md` unpersisted on PG/MariaDB (its `member_id` is never written), so
   `md.member_type` (has_one through member) resolves to nil. On SQLite the
   child is saved. Test: `through belongs to after destroy`. (Sibling
   `assigning to has one through preserves decorated join record` passes on PG —
   it also sets the `organization` writer, which triggers the child flush; the
   lone-child case does not.)

2. **Eager-loading a has_one_through with a WHERE on the source table nils on PG/MariaDB.**
   `Member.includes(:hairy_club)` (scope `where(clubs: { name })`, through
   `membership`, source `club`) preloads the club on SQLite but nil on
   PG/MariaDB. The through-table-condition arm (`favorite_club`) works on all
   adapters. Test: `has one through with conditions eager loading`.

Note: the `preloading has one through on belongs to` count test was NOT a trails
gap — it needed a `member.reload()` to settle the deferred has_one_through write
before the assert_queries_count block. Fixed in #4375.
