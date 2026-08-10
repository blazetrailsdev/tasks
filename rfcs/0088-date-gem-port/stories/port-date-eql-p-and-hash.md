---
title: "Port Date#eql? and Date#hash, the unported neighbours of the comparison cluster"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6314
claim: "2026-08-10T00:56:48Z"
assignee: "converge-date-infinity-nan-and-coerce-arms-to-lib-date-rb"
blocked-by: null
closed-reason: null
---

## Context

PR #6307 ported `Date`'s comparison cluster — `d_lite_cmp` (`<=>`), `d_lite_equal`
(`===`) and the `Comparable#==` over them — into `packages/date/src/date.ts`
(`Date#cmp`, `Date#caseEquals`, `Date#equals`), together with `Date#ajd`,
`m_real_jd`, `m_canonicalize_jd`, `cmp_gen`, `cmp_dd` and `equal_gen`.

Their two immediate neighbours in `vendor/date/ext/date/date_core.c` are still
unported, and both are registered on `cDate` right next to `<=>` / `===`
(`date_core.c:9794-9797`):

- `d_lite_eql_p` (`date_core.c:6925-6932`) — `Date#eql?`, `Qfalse` for a
  non-Date operand and `f_zero_p(d_lite_cmp(self, other))` otherwise. Note it is
  NOT `==`: `==` admits a Numeric through `cmp_gen`, `eql?` does not.
- `d_lite_hash` (`date_core.c:6934-...`) — `Date#hash`, over the
  `nth`/`jd`/`df`/`sf` quadruple, which is what makes `eql?`-equal dates hash
  alike.

`Date#cmp` is already in place, so `eql?` is a two-line body over it.

## Acceptance criteria

- [ ] `Date#isEql` ported against `d_lite_eql_p` (`date_core.c:6925-6932`),
      answering `false` — not `null` — for a non-`Date` operand.
- [ ] `Date#hash` ported against `d_lite_hash` (`date_core.c:6934`), reading the
      same `m_nth` / `m_jd` / `m_df` / `m_sf` quadruple `cmp_dd` does.
- [ ] Covered by the Ruby tests that exercise them once those files are enrolled
      (`test_switch_hitter.rb`'s `test_eql_p` / `test_hash`).
