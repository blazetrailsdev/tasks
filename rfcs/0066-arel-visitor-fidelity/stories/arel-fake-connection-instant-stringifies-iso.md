---
title: "FakeRecord double stringifies Temporal.Instant as ISO, not Ruby Time#to_s shape"
status: ready
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5057 review: quoting a `Temporal.Instant` through the arel
suite's `toSql()` path emits the ISO string (`'2024-01-01T00:00:00Z'`).
The FakeRecord double's `quote` (`packages/arel/src/test-helpers/connection.ts:86-104`)
has explicit arms only for `PlainDate`/`PlainDateTime` (mirroring
`vendor/rails/activerecord/test/cases/arel/attributes/../support/fake_record.rb:71-87`
`Date`/`DateTime` arms); `Instant`/`ZonedDateTime` fall to the `else`
string-fallback arm, whose `String(thing)` renders ISO. In Ruby, a `Time`
hitting FakeRecord's `else` arm renders `to_s` = `"2024-01-01 00:00:00 +0000"`
(space-separated), so the trails fallback shape diverges for the Time
analogue. #5057 worked around it by using `PlainDateTime` in the test.

## Acceptance criteria

- [ ] Decide the faithful rendering for `Temporal.Instant`/`ZonedDateTime`
      through the FakeRecord double's `else` arm (Ruby `Time#to_s` shape,
      `'YYYY-MM-DD HH:MM:SS +ZZZZ'`) and implement or justify at the call site.
- [ ] The #5057 `#lteq` "should accept various data types." test can use the
      Time analogue (`Instant`) directly, per Rails rb:268-276.
