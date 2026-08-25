---
title: "port-test-date-parse-formats-iso8601-family"
status: done
updated: 2026-08-17
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6661
claim: "2026-08-17T18:14:01Z"
assignee: "port-test-date-parse-formats-iso8601-family"
blocked-by: null
closed-reason: null
---

## Context

`port-test-date-parse-formats` assumed the format-specific parsers already
existed in `packages/date/src/date.ts`. They did not: only the heuristic
`date__parse` family (`date_parse.c:583-2300`) is ported. PR for that story
therefore ported the two smallest of the six — `date__rfc2822` /
`date__rfc822` (`date_parse.c:2797-2855`) and `date__httpdate`
(`date_parse.c:2861-3010`) — plus their `Date`/`DateTime` statics
(`date_core.c:4825-4945`, `:8584-8646`) and the four tests that exercise them
(`test__rfc2822`, `test__httpdate`, `test_rfc2822`, `test_httpdate`).

Remaining, all unported in `packages/date/src/date.ts`:

- `date__iso8601` (`date_parse.c:2329-2583`) — `iso8601_ext_datetime`,
  `iso8601_bas_datetime`, `iso8601_ext_time`, `iso8601_bas_time` and their `_cb`s.
- `date__rfc3339` (`date_parse.c:2586-2641`).
- `date__xmlschema` (`date_parse.c:2643-2796`) — the `datetime` / `time` /
  `trunc` arms.
- `date__jisx0301` (`date_parse.c:3017-3090`), whose no-match arm falls back to
  `date__iso8601`, so it must land with or after it.
- The `Date`/`DateTime` statics for each (`date_core.c` `date_s_iso8601` and
  friends), including the `Date::ITALY + 10` `start` argument.
- `check_limit` (`date_core.c`'s `limit:` kwarg, default 128), which nothing in
  the package implements yet and which `test_length_limit` is entirely about.

## Acceptance criteria

- [ ] The four parsers above are ported into `packages/date/src/date.ts` under
      their `date_parse.c` names, with their public statics.
- [ ] These tests land in `packages/date/src/test-date-parse.test.ts` under their
      Ruby names: `test__iso8601`, `test__rfc3339`, `test__xmlschema`,
      `test__jisx0301`, `test_iso8601`, `test_rfc3339`, `test_xmlschema`,
      `test_jisx0301`, `test_given_string`, `test_length_limit`.
- [ ] Split across PRs if it exceeds the LOC ceiling — but each PR takes whole
      tests, and `test_given_string` / `test_length_limit` land last, since they
      touch every parser.
- [ ] Ruby's `assert_raise(TypeError) { Date._iso8601(str.to_sym) }` has no port:
      a Ruby Symbol is a JS string (CLAUDE.md). Drop those lines, as the
      rfc2822/httpdate port did.
