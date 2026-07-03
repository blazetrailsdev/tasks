---
title: "hasone-through-pg-maria-eager-and-autosave-gaps"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4486
claim: "2026-07-03T14:57:55Z"
assignee: "hasone-through-pg-maria-eager-and-autosave-gaps"
blocked-by: null
closed-reason: null
---

## Context

Split out from `hasone-through-write-side-and-nil-stale-gaps` (RFC 0023). That
PR converged the SQLite-verifiable has_one_through write-side / nil-stale gaps
(build/create construct the through record, new-owner autosave, nil-load stale
reload, unpersisted-owner in-memory resolution) and un-skipped those tests. Two
`it.skip` tests in `has-one-through-associations.test.ts` remain: they pass on
SQLite but fail deterministically (reproduced in isolation) on PostgreSQL and
MariaDB, so they cannot be verified in a SQLite-only local run and were left
skipped rather than shipped un-verified.

trails source: `packages/activerecord/src/associations/has-one-through-association.ts`,
`packages/activerecord/src/autosave-association.ts`
Rails: `vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`,
`vendor/rails/activerecord/lib/active_record/autosave_association.rb`

Both skipped tests carry `TRACKED-PENDING-CONVERGENCE (0023
hasone-through-pg-maria-eager-and-autosave-gaps)` markers.

1. **has_one autosave does not persist a lone has_one child on `owner.save()`
   (PG/MariaDB).** `member.association("memberDetail").writer(md); await
member.save()` leaves `md` unpersisted on PG/MariaDB (its `member_id` is
   never written), so `md.member_type` (has_one through member) resolves to
   nil. On SQLite the child is saved. Test: `through belongs to after destroy`.
   (Sibling `assigning to has one through preserves decorated join record`
   passes on PG — it also sets the `organization` writer, which triggers the
   child flush; the lone-child case does not.) Likely tied to trails gating the
   unconditional has_one autosave callback on `options.autosave`
   (autosave-association.ts `addAutosaveAssociationCallbacks`), so a lone built
   child relies on `_pendingReplace`/`flushPendingReplaces` — investigate why
   the flush lands the row on SQLite but not PG/MariaDB.

2. **Eager-loading a has_one_through with a WHERE on the source table nils on
   PG/MariaDB.** `Member.includes(:hairy_club)` (scope `where(clubs: { name })`,
   through `membership`, source `club`) preloads the club on SQLite but nil on
   PG/MariaDB. The through-table-condition arm (`favorite_club`) works on all
   adapters. Test: `has one through with conditions eager loading`.

## Acceptance criteria

- [ ] Converge trails so both behaviors match Rails on PostgreSQL and MariaDB.
- [ ] Un-skip both `TRACKED-PENDING-CONVERGENCE` tests in
      `has-one-through-associations.test.ts` (names unchanged).
- [ ] No regression in has_one_through / has_many_through / nested-through /
      autosave suites on any adapter.
