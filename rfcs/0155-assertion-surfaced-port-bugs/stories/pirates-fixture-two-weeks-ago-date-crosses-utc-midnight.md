---
title: "pirates fixture 2.weeks.ago is a UTC Instant, not to_fs(:db); preserves-existing-fixture-data flips near UTC midnight"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8114
claim: "2026-09-25T22:17:02Z"
assignee: "base-inspect-singleton-class-arm"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working trails#8069. `FoxyFixturesTest > preserves existing fixture data`
(`packages/activerecord/src/fixtures.test.ts:959-962`) fails locally whenever local time and
UTC fall on different calendar days (observed 2026-09-24 ~19:50 local, past 00:00 UTC):
`expected '2026-09-11' to be '2026-09-10'`.

Rails (`vendor/rails/activerecord/test/fixtures/pirates.yml:5-9`) renders the fixture through ERB
as a `:db`-formatted string — `created_on: "<%= 2.weeks.ago.to_fs(:db) %>"` — and the test
(`vendor/rails/activerecord/test/cases/fixtures_test.rb:1362-1365`) compares
`2.weeks.ago.to_date` against `pirates(:redbeard).created_on.to_date`, i.e. both sides in the same zone.

trails' fixture (`packages/activerecord/src/test-helpers/fixtures/pirates.ts:2`) instead builds a
UTC `Temporal.Instant` from `Date.now()`, while the test takes `Duration.weeks(2).ago(Time.now()).toDate()`
on the other side, so the two dates are computed in different zones.

## Converged shape

- `pirates.ts` renders `redbeard`'s `created_on` / `updated_on` as the `2.weeks.ago.to_fs(:db)`
  string (the trails `Duration.weeks(2).ago(...)` + `toFs("db")` port), as the Rails YAML does.
- The test keeps Rails' two assertions (`created_on` and `updated_on`, both `.toDate()`).

## Acceptance criteria

- The test passes regardless of the host's local time zone and time of day.
- Both Rails assertions (`created_on`, `updated_on`) are ported.
