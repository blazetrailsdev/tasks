---
title: "Date._parse honours the limit: kwarg; :year can be a bigint"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6335
claim: "2026-08-10T13:33:27Z"
assignee: "date-parse-limit-kwarg-and-bignum-year"
blocked-by: null
closed-reason: null
---

## Context

`Date._parse` (`packages/date/src/date.ts`) takes `(str, comp)` only. MRI's
takes a `limit:` kwarg — `date__parse` raises `ArgumentError, "string length
(%ld) exceeds limit %ld"` before it runs any sub-parser
(`vendor/date/ext/date/date_parse.c`, `date__parse`'s limit check; the same
kwarg reaches `Date.parse` / `DateTime.parse` through `rb_scan_args`'s `"03:"`
opt arm, `date_core.c:4573`, `:8425`).

Two gem tests need it, both deferred out of PR #6322:

- `test__parse_too_long_year`
  (`vendor/date/test/date/test_date_parse.rb:591-603`) calls
  `Date._parse(str, limit: 100_010)` on `"Jan 1" + "0" * 100_000` and asserts
  `Math.log10(h[:year]) == 100_000`. That ALSO needs `DateParts.year` to be a
  `bigint`: a JS `number` cannot hold a 100,001-digit year, and the reader
  already answers `number | bigint` on `Date#year`.
- `test_length_limit` (`:1277-1302`) is the kwarg's own test.

## Converged shape

Add the `limit` kwarg to `Date._parse` / `Date.parse` / `DateTime.parse` and
the other `_`-parsers that take it, raising the C's message at the C's site;
widen `DateParts.year` (and `cwyear`) to `number | bigint` where the parser can
overflow, as `Date#year` already is.

## Acceptance criteria

- [ ] `limit:` is honoured with MRI's message and raise site.
- [ ] `test__parse_too_long_year` lands in
      `packages/date/src/test-date-parse.test.ts` as `parse too long year`.
- [ ] `pnpm parity:test --package date` credits it; no package regresses.
