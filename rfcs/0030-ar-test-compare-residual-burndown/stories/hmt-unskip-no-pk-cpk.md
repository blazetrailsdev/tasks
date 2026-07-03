---
title: "hmt-unskip-no-pk-cpk"
status: claimed
updated: 2026-07-03
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T15:57:50Z"
assignee: "hmt-unskip-no-pk-cpk"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-through-associations.test.ts` was converged in PR #4224. Four tests for no-PK join tables and composite-primary-key through associations remain skipped:

- trails: `associations/has-many-through-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`

Skipped tests:

- `no pk join table delete` (line 410) — delete from a HMT where the join table has no primary key; `lessons` table (no `id` column) as the through
- `no pk join model callbacks` (line 456) — callbacks on the join model fire correctly when join table has no PK
- `cpk association build through singular` (line 2353) — `build` on a HMT where the through model uses a composite primary key (`[blog_id, id]`)
- `post has many tags through association with composite query constraints` (line 2267) — HMT with composite query constraints on the through; join SQL includes both PK columns in the ON clause

Rails source: `activerecord/lib/active_record/associations/has_many_through_association.rb` — no-PK `delete_records` path; `activerecord/lib/active_record/associations/builder/has_many.rb` + CPK join-dependency.

Note: The `no pk join table delete` test uses the `lessons`/`lesson_students` tables which are in the canonical schema.

## Acceptance criteria

- [ ] Un-skip and pass all four tests under SQLite, PG, and MariaDB
- [ ] No-PK join table: delete removes the correct row by matching all non-PK FK columns
- [ ] No-PK join model: before/after_destroy callbacks still fire
- [ ] CPK through build: join record is built with both FK columns populated
- [ ] CPK query constraints: generated JOIN SQL includes both composite key columns in the ON clause
- [ ] No production regressions in `has-many-through-associations.test.ts`
