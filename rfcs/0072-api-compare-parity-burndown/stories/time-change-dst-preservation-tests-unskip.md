---
title: "Unskip the five Time#change DST-preservation tests"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6256
claim: "2026-08-08T18:16:03Z"
assignee: "pg-adapter-test-aftereach-connect-hook-timeout"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/time-ext.test.ts` carries five bodyless
`it.skip` stubs for `Time#change`'s DST tests
(`activesupport/test/core_ext/time_ext_test.rb`):

- `test_change_preserves_offset_for_local_times_around_end_of_dst` (`:472`)
- `test_change_preserves_offset_for_zoned_times_around_end_of_dst` (`:500`)
- `test_change_preserves_fractional_seconds_on_zoned_time` (`:528`)
- `test_change_preserves_fractional_hour_offset_for_local_times_around_end_of_dst` (`:538`)
- `test_change_preserves_fractional_hour_offset_for_zoned_times_around_end_of_dst` (`:566`)

The implementation arms they exercise now exist: the fold-selection block
landed in PR #6198 and the `:offset`/`:nsec`/`utc?` arms in PR #6246, so the
skips are stale rather than blocked. The zoned ones should pass as written; the
local ones depend on the `elsif zone` / `isdst` gap filed separately.

## Acceptance criteria

- [ ] Each of the five is ported with its Rails name verbatim and unskipped,
      or blocked with the specific implementation gap.
- [ ] Bodies mirror the Rails assertions, including `with_env_tz`.
