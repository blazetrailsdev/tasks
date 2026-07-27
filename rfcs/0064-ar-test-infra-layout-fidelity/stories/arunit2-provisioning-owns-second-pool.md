---
title: "connect() should establish ARUnit2Model once arunit2 is provisioned"
status: in-progress
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5414
claim: "2026-07-27T14:57:23Z"
assignee: "arunit2-provisioning-owns-second-pool"
blocked-by: null
closed-reason: null
---

## Context

`ARTest.connect` establishes both bases: `ActiveRecord::Base.establish_connection
:arunit` **and** `ARUnit2Model.establish_connection :arunit2`
(`vendor/rails/activerecord/test/support/connection.rb:32-33`). trails'
`support/connection.ts` does only the first.

Doing the second in `connect()` was tried in #5397 and reverted: `College` and
`Course` extend `ARUnit2Model`
(`packages/activerecord/src/test-helpers/models/college.ts`), so establishing
that base at worker startup points every suite's colleges/courses at the arunit2
database, which does not carry those tables. All three lanes went red with
`no such table: colleges` from
`packages/activerecord/src/test-helpers/use-fixtures.test.ts:785`.

Rails does not have this problem because its arunit2 database genuinely holds
`colleges` / `courses` — its schema is loaded there. In trails those tables only
appear in arunit2 inside `setupSecondPool`
(`packages/activerecord/src/support/setup-second-pool.ts`), which calls
`rebuildCanonicalTables(arunit2, ["colleges", "courses", "professors",
"courses_professors"])` and drops them from the primary database for the
duration of `MultipleDbTest`.

`connect()` already publishes the `arunit2` entry in `Base.configurations`, so
the config side is done; only pool ownership is outstanding.

## Acceptance criteria

- The arunit2 database is provisioned with its tables before any suite runs, so
  `ARUnit2Model` can hold a pool for the whole worker the way Rails does.
- `connect()` establishes `ARUnit2Model` on `arunit2`, mirroring
  `connection.rb:33`, and the comment recording why it does not is deleted.
- `setupSecondPool` no longer needs to establish the pool itself; its
  primary-database surgery (dropping the arunit2-only tables) is reconsidered in
  that light.
- `use-fixtures.test.ts` and the rest of the suite stay green on all three lanes.
- Likely sequenced with the PG/MySQL `CREATE DATABASE` provisioning that
  `arunit2-config.ts` documents as outstanding.
