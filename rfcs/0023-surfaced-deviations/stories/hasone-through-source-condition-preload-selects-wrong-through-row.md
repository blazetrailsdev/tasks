---
title: "hasone-through-source-condition-preload-selects-wrong-through-row"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4508
claim: "2026-07-03T20:19:09Z"
assignee: "hasone-through-source-condition-preload-selects-wrong-through-row"
blocked-by: null
closed-reason: null
---

## Context

Split out from `hasone-through-pg-maria-eager-and-autosave-gaps` (RFC 0023, PR
4486). That PR converged the lone-child has_one autosave gap and un-skipped
`through belongs to after destroy`, but the eager-loading arm remained a real
PG/MariaDB deviation and was left skipped.

**Symptom:** `has one through with conditions eager loading` in
`packages/activerecord/src/associations/has-one-through-associations.test.ts`
(marker `TRACKED-PENDING-CONVERGENCE (0023
hasone-through-source-condition-preload-selects-wrong-through-row)`). The
source-table-condition arm — `Member.includes("hairyClub")`, scope
`where({ clubs: { name: "Moustache and Eyebrow Fancier Club" } })`, through
`membership`, source `club` — preloads the club correctly on SQLite but nils on
PostgreSQL/MariaDB. It fails only under the full parallel suite (CI), not in a
single-file local run, because the deviation depends on through-row ordering
(unstable on PG/MariaDB, incidentally moustache-first on SQLite). CI evidence:
PR #4486 PG job, `expected undefined to be 828473226n` at line 319.

**Root cause:** `packages/activerecord/src/associations/preloader/through-association.ts`
(~lines 388-404, `_partitionReflectionWhere` / through-scope builder) splits the
reflection scope's WHERE by referenced table: through-table predicates are added
to the through query, while source/target-table predicates are deferred to the
source-preloader stage (the deliberate "cover the JOIN branch's intent without a
single-query JOIN" tradeoff). For a **has_one** through this breaks: the
preloader materializes the first through record (groucho has four unordered
`Membership`-STI rows — moustache=favorite, boring, super, selected — because
`Member.hasOne("membership")` targets the STI base and matches all subtypes),
then applies the source `clubs.name` filter to only that one's club. When the
first through record is not the moustache membership, its club is filtered out
and the has_one target is nil, even though another through record's club would
match. The through-table arm (`favoriteClub`, `where("memberships.favorite = ?",
true)`) works because its predicate lands on the through query and selects the
right membership up front.

Rails preloads this via a single query that JOINs through+source with all scope
conditions applied together, so the source condition constrains which through
row wins (vendor/rails
`activerecord/lib/active_record/associations/preloader/through_association.rb`
`through_scope`, which joins the source reflection and copies
`reflection_scope.where_clause` onto the joined query).

trails source: `packages/activerecord/src/associations/preloader/through-association.ts`,
`packages/activerecord/src/associations/has-one-through-association.ts`.
Rails: `vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb`,
`.../has_one_through_association.rb`.

## Acceptance criteria

- [ ] Converge the has_one-through preloader so a **source-table** scope
      condition constrains which through record is selected — i.e. apply source
      predicates as a JOIN on the through query (or otherwise defer the has_one
      "first row" pick until after source filtering) so ordering no longer
      decides the result. Match Rails' single-JOIN `through_scope`.
- [ ] Un-skip `has one through with conditions eager loading` in
      `has-one-through-associations.test.ts` (name unchanged) and verify it
      passes on SQLite, PostgreSQL, and MariaDB — both in isolation and in the
      full parallel suite.
- [ ] No regression in has_one_through / has_many_through / nested-through /
      preloader suites on any adapter (the split-where path at
      through-association.ts:388-404 must keep working for through-table and
      has_many source conditions).
