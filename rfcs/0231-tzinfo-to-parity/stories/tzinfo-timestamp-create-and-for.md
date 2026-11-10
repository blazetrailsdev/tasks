---
title: "tzinfo-timestamp-create-and-for"
status: draft
updated: 2026-11-10
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/tzinfo/lib/timestamp.ts` (tzinfo-timestamp) ports the constructor, `initialize!`, `new!`,
`Timestamp.utc` and every instance member of `vendor/tzinfo/v2.0.6/lib/tzinfo/timestamp.rb`. It was
split at the 800-LOC ceiling; still unported:

- `Timestamp.create` (`timestamp.rb:56-82`) — days_from_civil; Ruby Integer `/` floors, so each
  division is `Math.floor`.
- `Timestamp.for` (`timestamp.rb:112-159`) and its private helpers `for_time` (`:209-223`),
  `for_datetime` (`:234-246`), `for_timestamp` (`:260-279`), `is_time_like?` (`:287-289`),
  `for_time_like` (`:300-314`). `offset` is `"preserve"` / `"ignore"` / `"treat_as_utc"`; the block
  is a trailing function. `for_time` reads `Time#toI`, `#subsec`, `#utcOffset`, `#isUtc`;
  `for_datetime` reads `DateTime#jd`, `#sec`, `#min`, `#hour`, `#secFraction`, `#offset`.
- Tests in `vendor/tzinfo/v2.0.6/test/tc_timestamp.rb:447-610` (`test_create_*`) and `:612-1252`
  (`for_test` helper, `test_for_*`, `TestTimestampSubclass`) — add to
  `packages/tzinfo/test/timestamp.test.ts` with literal `it("…")` names (test-compare cannot see
  a name from a loop variable).

## Acceptance criteria

- [ ] `Timestamp.create`, `Timestamp.for`, `forTime`, `forDatetime`, `forTimestamp`, `isTimeLike`,
      `forTimeLike` ported at their Ruby names in `packages/tzinfo/lib/timestamp.ts`.
- [ ] `tc_timestamp.rb`'s `test_create_*` and `test_for_*` tests ported by name.
- [ ] `tc_timestamp.rb`'s `test_compare` (`:362-395`) and `test_eql` (`:397-430`) ported, one inline
      `expect` per Rails assertion (`Timestamp#compareTo` / `#eql` already exist; these were cut for
      the LOC ceiling).
