---
title: "port-date-ajd-and-cmp-gen"
status: closed
updated: 2026-08-09
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
closed-reason: "Superseded: Date#ajd, m_real_jd, cmp_gen and equal_gen's rb_num_coerce_cmp tail all landed in PR #6307 on review feedback, so nothing is left to schedule."
---

## Context

`Date#<=>` was ported in the `port-test-date-compat` PR (`packages/date/src/date.ts`,
`Date#cmp`) against `d_lite_cmp` (`vendor/date/ext/date/date_core.c:6804-6843`).

The `k_date_p(other)` arm — the fast simple/simple path and `cmp_dd`
(`date_core.c:6707-6761`) — is ported in full. The `!k_date_p(other)` arm,
`cmp_gen` (`date_core.c:6694-6705`), is NOT: it compares `m_ajd(dat)` against a
Numeric, and `Date#ajd` (`date_core.c` `d_lite_ajd`, over `m_ajd`,
`date_core.c:1564-1580`) has no port at all — there is no `ajd` reader on
`packages/date/src/date.ts`'s `Date`. So `Date#cmp` is typed `other: Date`.

`equal_gen` (`date_core.c:6845-6855`) IS ported, since it reads `m_real_local_jd`
(= the existing `Date#jd`) rather than `ajd`; its `rb_num_coerce_cmp` fallback
(nil for a non-coercing object) is not.

## Acceptance criteria

- [ ] `Date#ajd` ported against `m_ajd` (`date_core.c:1564-1580`), answering a
      `Rational` for both the simple and complex arms.
- [ ] `cmp_gen` (`date_core.c:6694-6705`) ported, and `Date#cmp` widened to the
      Numeric operand it admits.
- [ ] `equal_gen`'s `rb_num_coerce_cmp` fallback answers `null` (Ruby `nil`) for
      an incomparable object.
