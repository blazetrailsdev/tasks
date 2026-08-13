---
title: "trails' Rational never canonicalizes a denominator of 1 to an Integer, so ported FIXNUM_P fast paths silently miss"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6338
claim: "2026-08-10T14:33:26Z"
assignee: "date-seat-drops-nth-and-spells-the-residue-year"
blocked-by: null
closed-reason: null
---

> **CORRECTION (2026-08-13, via
> `audit-the-disproven-rational-canonicalization-premise`): the premise below is
> wrong, and the title with it.** Ruby's Rational _arithmetic_ does NOT fold a
> denominator of one to an Integer. Verified on ruby 3.3.11:
> `(Rational(1,2) * 12)` is `(6/1)`, class `Rational`; `Rational(9,3)` is
> `(3/1)`; `Rational(1,2) + Rational(1,2)` is `(1/1)`. Only `rb_rational_new`,
> the C constructor, folds — and `wholenum_p` (`date_core.c:3183-3206`) is a
> PREDICATE the C sends explicitly at `d_lite_plus`'s `T_RATIONAL` arm
> (`:6179-6182`), not evidence of an automatic fold. The consequence runs the
> other way round: a `FIXNUM_P` test over a value that can arrive as a Rational
> is **false** for every reducible Rational, and the Rational arm is the one MRI
> takes — which is what #6338 fixed in `d_lite_rshift` (`:6441-6478`). trails'
> `Rational` staying a `Rational` is therefore correct, and the "Converged
> shape" below must NOT be implemented; the shipped fix was the branch it
> deprecates.

## Context

Surfaced in #6321 (`Date#>>`), review rounds 2-3.

Ruby's Rational arithmetic **canonicalizes a denominator of 1 back to an
Integer** (`rational.c` `nurat_canonicalize` / `f_cmp`-adjacent
`rb_rational_canonicalize`, reached from `nurat_add` / `nurat_mul` /
`nurat_div`). Trails' `Rational` (`packages/date/src/date.ts:1050-1140`) never
does: `new Rational(6, 1)` stays a `Rational`, and `Rational(1,2).mul(12)` stays
`(6/1)` rather than becoming the Integer `6`.

That difference is invisible until a ported C body branches on `FIXNUM_P`. In
`d_lite_rshift` (`vendor/date/ext/date/date_core.c:6441-6478`):

```c
t = f_add3(f_mul(m_real_year(dat), INT2FIX(12)), INT2FIX(m_mon(dat) - 1), other);
if (FIXNUM_P(t)) { /* long DIV/MOD fast path */ }
else { y = f_idiv(t, INT2FIX(12)); t = f_mod(t, INT2FIX(12)); m = FIX2INT(t) + 1; }
```

`Date.new(2000,1,31).next_year(Rational(1,2))` reaches this with `f_mul(n, 12)`
= `(6/1)` — which Ruby has already turned into the Integer `6`, so `t` is a
Fixnum and the FAST path runs. #6321 had to hand-spell that as a
`t.denominator === 1n` branch inside `rshift` to get Ruby's `2000-07-31`.

Every other ported body with a `FIXNUM_P` / `k_integer_p` branch over a value
that can arrive as a `Rational` has the same latent gap, and none of them are
covered by the gem's own tests, which use Integer arguments throughout — so the
suite stays green either way. `d_lite_plus` (`:6154-6270`) and `d_lite_cmp`
(`:6804-6843`) are the obvious neighbours to audit.

## Converged shape

`Rational`'s constructor (or its `add` / `mul` / `quo` results) answers the
Integer when the reduced denominator is `1`, as Ruby does — or, if a TS union
return is worse than the branch, `Rational` grows the predicate the ported
bodies branch on so no call site hand-rolls `denominator === 1n`. Then
`rshift`'s two arms read as the C's `FIXNUM_P(t)` test rather than as a
trails-specific workaround, and the audit of sibling `FIXNUM_P` bodies has one
thing to check rather than N.

Note the return-type question is the real work: Ruby's Rational is duck-typed
with Integer, TS's is a class, and `packages/date/src/date.ts` threads
`number | bigint | Rational` through most numeric parameters already.

## Acceptance criteria

- [ ] Denominator-1 results follow Ruby's canonicalization (or the equivalent
      predicate exists and is what ported bodies branch on).
- [ ] `rshift`'s `t.denominator === 1n` branch is expressed in those terms.
- [ ] Sibling `FIXNUM_P` / `k_integer_p` bodies in `date.ts` audited for the
      same gap, with anything found either fixed or filed.
- [ ] `Date.new(2000,1,31).nextYear(new Rational(1,2))` stays `2000-07-31`;
      `>> Rational(1,2)` stays `2000-01-31`, `>> Rational(3,2)` `2000-02-29`.
