---
title: "port-test-date-strftime-different-format"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6708
claim: "2026-08-18T18:14:58Z"
assignee: "port-test-date-strftime-different-format"
blocked-by: null
closed-reason: null
---

## Context

`port-test-date-strftime-gnuext` ported `test/date/test_date_strftime.rb`'s
GNU coreutils extension block (`:216-356`) and `test_overflow` (`:445-452`)
into `packages/date/src/test-date-strftime.test.ts`, but deliberately left
`test__different_format` (`vendor/date/test/date/test_date_strftime.rb:359-443`)
out: it is the one test in the file that exercises the instance formatters
rather than `strftime`, and none of them exist in `packages/date/src/date.ts`
yet.

What the test needs, none of which greps in `date.ts`:

- `Date#ctime` / `Date#asctime` (`date_core.c` `d_lite_asctime`)
- `Date#iso8601` / `#xmlschema` / `#rfc3339` and the `DateTime` arms that take
  an `n` argument (`d_lite_iso8601`, `dt_lite_iso8601`)
- `Date#jisx0301` / `DateTime#jisx0301`, including the Japanese era table
  (M/T/S/H/R) the test walks with ten fixed dates
- `DateTime.iso8601` / `.rfc3339` / `.jisx0301` with the `limit:` kwarg and its
  `ArgumentError` message `string length (\d+) exceeds`

`Date.rfc2822` / `.httpdate` landed in PR #6333; the instance-side
`#rfc2822` / `#httpdate` this test also calls are still absent.

## Acceptance criteria

- [ ] `test__different_format` is ported into
      `packages/date/src/test-date-strftime.test.ts` under its Ruby name
      (`it("different format")`), and `pnpm parity:test --package date` credits it.
- [ ] Whatever formatters it needs are ported into `packages/date/src/date.ts`
      at the C names, citing `date_core.c` `file:line` at each.
- [ ] If the formatter set is larger than one PR, ship the part that fits and
      file the rest as a sibling story — do not grow the PR.
