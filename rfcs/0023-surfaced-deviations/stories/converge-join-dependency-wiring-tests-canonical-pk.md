---
title: "Converge pure-wiring join-dependency tests to canonical PKs so they ride fixtures({})"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-createtestadapter-callers-base-connection` (RFC 0059, PR
PR 4500). That PR converged the join-dependency test suite onto `Base.connection`
but left the 10 pure-wiring files on `setupFixtures()` rather than the
`fixtures({})` endgame surface, because `fixtures({})` opts into `TEST_SCHEMA`
and warms the schema cache — which breaks their partial-decl assertions.

Concrete evidence (verified on PR 4500): canonical `owners` has
`primary_key: "owner_id"` (schema.rb), so a warmed inline `Owner` model resolves
the hasMany join key to `owners.owner_id`, but the test asserts `owners.id`
(`expected 'owner_id' to be 'id'`). Similarly canonical `posts`/`comments` carry
full column sets, which shifts the hand-built `tN_rN` hydration indices these
tests construct by hand.

Affected files (packages/activerecord/src/associations/):
`join-dependency-{alias-tracker,belongs-to-dedup,duplicate-objects,extra-columns,
nested-hydration,polish,quoting,spec,through-aliasing,walk}.test.ts`. All use
declared-attribute-only inline models on canonical table names + hand-built join
rows, and currently ride `setupFixtures()` (bare handler, no warming).

## Acceptance criteria

- Converge the 10 pure-wiring join-dependency suites to the canonical schema so
  they can ride `fixtures({})` uniformly (matching the endgame surface): use the
  real canonical PKs/columns (e.g. `owners.owner_id`) in models and assertions,
  or the canonical models directly, rather than partial-decl inline classes
  asserting `owners.id`.
- Read the corresponding canonical schema.rb table shape for each table the
  tests touch (owners/assets, posts/comments, etc.) first.
- No test renames; `test:compare` delta >= 0. All suites pass under `fixtures({})`.
- Once done, `setupFixtures()` should no longer be needed in these files.
