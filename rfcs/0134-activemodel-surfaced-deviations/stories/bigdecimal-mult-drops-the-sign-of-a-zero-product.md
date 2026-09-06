---
title: "BigDecimal#mult drops the sign of a zero product"
status: ready
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7551 while converging
`bigdecimal-round-diverges-from-mri-on-negative-ndigits`. That story taught
`round` and `fromUnscaled` to carry the sign of a zero result (MRI's
`VpSetZero(y, VpGetSign(y))`, `vendor/ruby/ext/bigdecimal/bigdecimal.c:7299`),
and made `parse` keep it for a literal `"-0.0"`. `mult` was left behind.

`BigDecimal#mult` (`conversions.ts`) ends in
`BigDecimal.fromUnscaled(this.unscaled() * other.unscaled(), ...)`, and
`fromUnscaled`'s `negative` parameter defaults to `value < 0n` — which is
`false` for a `0n` product. So a product whose magnitude is zero loses the sign
Ruby keeps:

```console
$ ruby -rbigdecimal -e 'p (BigDecimal("-2") * BigDecimal("0")).to_s("F")'
"-0.0"
$ ruby -rbigdecimal -e 'p (BigDecimal("2") * BigDecimal("-0.0")).to_s("F")'
"-0.0"
```

trails answers `"0.0"` for both (verified against the merged tree).

MRI takes the sign from the operands, not from the product's magnitude:
`VpMult` sets `c->sign = VpGetSign(a) * VpGetSign(b)` before normalizing
(`bigdecimal.c` `VpMult`), and the zero short-circuit
`VpSetZero(c, VpGetSign(a) * VpGetSign(b))` does the same.

## Converged shape

`mult` passes the product's sign explicitly, the way `round` now does:
the result is negative when exactly one operand is negative, including when the
product's magnitude is zero. `fromUnscaled`'s third parameter already exists for
this; only the call site changes.

Check `abs`, `div` and the unary forms for the same shape while there — `abs`
already passes a magnitude and an explicit sign, so it is likely fine, but it
has not been differentially checked against MRI.

Related: [[bigdecimal-round-diverges-from-mri-on-negative-ndigits]] (done, #7551)
is where the signed-zero seat came from.

## Acceptance criteria

- [ ] `BigDecimal("-2").mult(BigDecimal("0")).toString("F")` is `"-0.0"`, and
      `BigDecimal("2").mult(BigDecimal("-0.0")).toString("F")` is `"-0.0"`.
- [ ] A sign-of-zero case list for `mult` is pinned in
      `packages/activesupport/src/core-ext/bigdecimal.trails.test.ts` and fails
      on the baseline.
- [ ] `bigdecimal.test.ts`, `bigdecimal.trails.test.ts`, `decimal.test.ts` and
      `decimal.trails.test.ts` keep their names and pass.
