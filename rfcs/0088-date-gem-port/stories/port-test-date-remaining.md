---
title: "port-test-date-remaining"
status: closed
updated: 2026-08-10
rfc: "0088-date-gem-port"
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
closed-reason: "superseded: port-test-date now records the 5 landed tests and stays open for the remaining 4"
---

## Context

`port-test-date` (PR pending) enrolled `packages/date/src/test-date.test.ts`
against `vendor/date/test/date/test_date.rb` and credited 3 of the file's 9
tests: `test__const`, `test_freeze`, `test_deconstruct_keys`. It added
`Date::MONTHNAMES` / `ABBR_MONTHNAMES` / `DAYNAMES` / `ABBR_DAYNAMES`
(`date_core.c:9420-9443`, `:9598-9614`) and `Date#deconstruct_keys` /
`DateTime#deconstruct_keys` (`date_core.c:7416-7464`, `:7500-7504`) to get
there.

The remaining 6 tests were left out because each needs gem surface RFC 0088
has not ported at all — porting them is an implementation story, not a test
story, and would have blown the PR LOC ceiling:

- `test_range_infinite_float` (`test_date.rb:9`) — `Date.today`, `Date#+`,
  `Date#-`, and Ruby `Range#cover?` over a `Float::INFINITY` endpoint.
- `test_sub` (`test_date.rb:47`) — subclass propagation through `#+`, `#-`,
  `#>>` (`d_lite_rshift`, `date_core.c`), `#<<`, `#succ`/`#next`
  (`d_lite_next_day`), `#italy`/`#england`/`#julian`/`#gregorian` (these four
  exist), plus `Marshal.dump`/`load` (`d_lite_marshal_dump`).
- `test_eql_p` (`test_date.rb:107`) — `Date#==` / `#eql?`
  (`d_lite_equal`, `date_core.c`).
- `test_hash` (`test_date.rb:122`) — `Date#hash` (`d_lite_hash`) plus the
  `eql?`/`hash` pair used as a Hash key; JS `Map` is identity-keyed, so this
  one needs a decision on how the pair is expressed at all.
- `test_submillisecond_comparison` (`test_date.rb:150`) — `Date#<=>`
  (`d_lite_cmp`, `date_core.c:6804-6845`) over `cmp_dd`
  (`date_core.c:6707-6760`), which needs `m_ajd`/`m_df`/`m_sf` readers on both
  `Date` and `DateTime`.
- `test_infinity_comparison` (`test_date.rb:157`) — `Date::Infinity`
  (`vendor/date/lib/date.rb:17-68`), and, for the `Float::INFINITY <=> inf`
  direction, MRI's `flo_cmp` `infinite?` duck-typing protocol.

## Acceptance criteria

- [ ] The six tests above are ported into
      `packages/date/src/test-date.test.ts` alongside the three already there,
      under the descriptions `parity:test` matches (Ruby name minus `test_`,
      `_` → space).
- [ ] The gem surface each needs is implemented in `packages/date/src/date.ts`
      against the cited C, not stubbed or worked around in the test.
- [ ] `pnpm parity:test --package date` moves `test_date.rb` from 3/9 to 9/9
      and no other package regresses.
- [ ] If the whole set does not fit one PR, ship a coherent subset (e.g. the
      `<=>`/`eql?`/`hash` cluster) and file the rest — do not open sibling PRs.
