---
title: "floatRoundOverflow reads FLOAT_DIG instead of a 15 literal"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activemodel", "activerecord"]
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI defines `Float::DIG` once: `rb_define_const(rb_cFloat, "DIG", INT2FIX(DBL_DIG))`
(`vendor/ruby/v3.3.11/numeric.c:6283`). The two Rails readers are converged:
ruby-compat exports `FLOAT_DIG` (`packages/ruby-compat/src/index.ts:280`), and
`packages/activemodel/src/type/decimal.ts:69-70` (`decimal.rb:91-92`) and
`packages/activerecord/src/validations/numericality.ts:11` (`numericality.rb:7`)
import it.

One literal is left: `floatRoundOverflow` in
`packages/ruby-compat/src/numeric.ts:82` spells `DBL_DIG + 2`
(`numeric.c:2546`) as `const floatDig = 15 + 2`.

## Acceptance criteria

- [ ] `floatRoundOverflow` reads `FLOAT_DIG + 2`, with no `15` literal.
