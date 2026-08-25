---
title: "port-test-date-parse-formats-iso8601-tests"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6705
claim: "2026-08-18T15:10:51Z"
assignee: "port-test-date-parse-formats-iso8601-tests"
blocked-by: null
closed-reason: null
---

## Context

PR for `port-test-date-parse-formats-iso8601-family` ported the four remaining
format-specific parsers into `packages/date/src/date.ts` — `date__iso8601`
(`date_parse.c:2329-2578`), `date__rfc3339` (`:2586-2641`), `date__xmlschema`
(`:2643-2792`) and `date__jisx0301` (`:3017-3081`) — together with their
`Date`/`DateTime` statics (`date_core.c` `date_s__iso8601`/`date_s_iso8601` and
siblings, `:4617-5018`, `:8466-8690`). It shipped only the `rfc3339` pair of
tests (`test__rfc3339` / `test_rfc3339`).

The rest of the tests are still unported:

- `test__iso8601` (`vendor/date/test/date/test_date_parse.rb:714-871`)
- `test__xmlschema` (`:893-978`)
- `test__jisx0301` (`:1042-1121`)
- `test_iso8601` (`:1123-1134`), `test_xmlschema` (`:1149-1160`),
  `test_jisx0301` (`:1196-1231`)
- `test_given_string` (`:1233-1275`)

**They must land in `test__X` / `test_X` PAIRS.** `scripts/test-compare/compare.ts`'s
`normPath` (`:176`) lowercases and `.trim()`s the description, so `test__iso8601`
and `test_iso8601` normalize to the same path `testdateparse > iso8601`. Porting
only one of a pair makes the compare matcher greedily pair Rails' `test__iso8601`
(49 assertions) with the trails `it("iso8601")` (6), which reds
`pnpm parity:test:assertions --package date`. Landing both makes the path shared
and the pairing correct, exactly as the already-ported `rfc2822` pair does.

`it("length limit")` is DONE — that PR landed all 22 of Ruby's arms
(`:1277-1303`) at once, since every parser it exercises now exists. Do not
touch it.

## Acceptance criteria

- [ ] The three `test__X` / `test_X` pairs and `test_given_string` land in
      `packages/date/src/test-date-parse.test.ts` under their Ruby names,
      taking `test_date_parse.rb` from 17/26 to 26/26.
- [ ] `pnpm parity:test --package date` credits every added test and
      `pnpm parity:test:assertions --package date` stays green.
- [ ] Split across PRs if the LOC ceiling requires — but never split a pair.
- [ ] Ruby's `assert_raise(TypeError) { Date._iso8601(str.to_sym) }` has no
      port: a Ruby Symbol is a JS string (CLAUDE.md). Spell the non-String
      argument as the ported `rfc2822`/`rfc3339` tests already do.
