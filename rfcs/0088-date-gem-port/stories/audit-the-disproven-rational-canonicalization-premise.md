---
title: "Audit RFC 0088 for the disproven Rational-canonicalization premise"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6471
claim: "2026-08-13T15:55:42Z"
assignee: "port-relation-sum-block-arm"
blocked-by: null
closed-reason: null
---

## Context

PR 6338 disproved a premise that is written into RFC 0088 story text, into
PR 6321's review record, and possibly into ported bodies. Verified on
`ruby 3.3.11` (`ruby` is on PATH in this environment):

```ruby
(Rational(1,2) * 12)            #=> (6/1)   -- class Rational, NOT Integer 6
Rational(9,3)                   #=> (3/1)   -- class Rational
(Rational(1,2) + Rational(1,2)) #=> (1/1)   -- class Rational
```

**Ruby's Rational arithmetic does not fold a denominator of one to an Integer.**
Only `rb_rational_new`, the C constructor (`rational.c`), does — which is why
`(Date.new(2001,1,1) + Rational(2,1)).day_fraction` is the Integer `0`. And
`wholenum_p` (`vendor/date/ext/date/date_core.c:3183-3206`) is a PREDICATE the C
sends explicitly at `d_lite_plus`'s `T_RATIONAL` arm (`:6179-6182`); it is not
evidence of an automatic fold.

The consequence: a C body's `FIXNUM_P` test over a value that can arrive as a
Rational is **false** for every reducible Rational, and the Rational arm is the
one MRI takes. #6338 fixed `d_lite_rshift` (`:6441-6478`), where both the
pre-existing code and #6338's own first attempt routed `Rational(1,2)` to the
Fixnum arm — a branch MRI never takes.

`offset_to_sec` (`:2407-2434`) shows the same fact changing OUTPUT, not just
control flow: `day_to_sec(Rational(2,1))` stays `(172800/1)`, so the
`FIXNUM_P(vn) && vd == 1` arm is live and skips the `±DAY_IN_SECONDS` bound —
which is why MRI accepts that offset as `"+48:00"`. A port that "canonicalized"
there would reject an offset MRI accepts.

## Converged shape

Sweep RFC 0088 for the claim and for code written against it:

- `grep -rn "canonicaliz" rfcs/0088-date-gem-port/` in the tasks repo — story
  bodies asserting the fold get a correction note; a story whose acceptance
  criteria depend on it gets re-specified.
- `grep -rn "denominator === 1n\|wholenumP\|fixnumP" packages/date/src/date.ts`
  — each site is either the C's own inline fold (`date_parse.c:531-534`), a
  `wholenum_p` predicate test, or an `rb_rational_new` display read. Anything
  else is a fold Ruby does not perform.
- Any remaining `FIXNUM_P` / `k_integer_p` body taking a Numeric parameter:
  confirm against `ruby -e` which arm MRI takes before trusting the C alone.

## Acceptance criteria

- [ ] Every RFC 0088 story asserting Rational-arithmetic canonicalization is
      corrected or re-specified.
- [ ] Every `denominator === 1n` site in `date.ts` is one of the three
      legitimate shapes above, cited at the call site.
- [ ] No ported body routes a reducible Rational to a `FIXNUM_P` arm.
