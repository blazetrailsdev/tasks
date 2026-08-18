---
title: "port-test-date-parse-heuristic-remainder"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6706
claim: "2026-08-18T15:20:49Z"
assignee: "port-test-date-parse-heuristic-remainder"
blocked-by: null
closed-reason: null
---

## Context

`port-test-date-parse-heuristic` (PR from `port-test-date-conv-date-plus-arms`)
shipped 7 of the heuristic `_parse`/`parse` family into
`packages/date/src/test-date-parse.test.ts`: "&#32;parse slash exp", "&#32;parse&#32; 2",
"parse", "parse&#32; 2", "&#32;parse odd offset", "parse utf8", "parse&#32; ex". It also
converged `Date.parse` / `DateTime.parse`'s default `str`
(`date_core.c:4577`, `:8429`) and `parse_time`'s Unicode-aware alphabetic zone
class (`date_parse.c:720-723`).

Five remain in `vendor/date/test/date/test_date_parse.rb` lines 8-713, each
blocked on a reader this package has not ported:

- `test__parse` (`:8-434`) — the ~420-line table against `date__parse`. It is a
  PR of its own; it needs nothing new, only the LOC budget.
- `test__parse_too_long_year` (`:591-603`) — needs `Date._parse`'s `limit:`
  kwarg (`date_parse.c` `date__parse`'s `limit` check) AND a `bigint` `:year`
  in `DateParts`: the test asserts `Math.log10(h[:year]) == 100_000`, which a
  JS `number` cannot represent.
- `test_parse__time` (`:605-624`) — needs `Time#to_s` / `#asctime` and the
  `time` library's `#iso8601` / `#rfc2822` / `#httpdate` / `#xmlschema`;
  `packages/date/src/time.ts` has none of them.
- `test_parse__comp` (`:626-656`) — needs `DateTime.now`.
- `test_parse__d_to_s` (`:658-664`) — needs `DateTime#to_s`
  (`date_core.c` `dt_lite_to_s`); only `Date#toS` is ported.

## Acceptance criteria

- [ ] `test__parse`'s table lands in `packages/date/src/test-date-parse.test.ts`
      under the name "&#32;parse" (`extract-ruby-tests.rb:514`: strip `test_`, then
      `tr("_", " ")`), as its own PR if the budget requires.
- [ ] The four blocked tests land once their readers are ported — port each
      reader against the C `file:line` above, in the Rails/gem file layout.
- [ ] `pnpm parity:test --package date` credits every added test; the date
      package's totals only move up.
- [ ] Temporal-vs-`Date`/`DateTime` assertion-value mismatches stay benign
      (`vendor/sources.ts:212-221`) — do not converge a Temporal return back.
