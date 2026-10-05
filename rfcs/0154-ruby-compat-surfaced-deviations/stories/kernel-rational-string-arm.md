---
title: "Port Kernel#Rational's String arm (string_to_r_strict / parse_rat)"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rational()` in `packages/ruby-compat/src/rational.ts` ports `Kernel#Rational`
(`vendor/ruby/v3.3.11/rational.c:2557` `nurat_convert`) for Integer, Float,
Rational and `to_r` operands only. The String arm is missing: `nurat_convert`
sends a String through `string_to_r_strict` (`rational.c:2476-2495`), which is
`parse_rat` (`:2406-2473`) over `read_num` (`:2338-2395`), `read_sign`
(`:2308`) and `skip_ws` (`:2398`), raising
`ArgumentError "invalid value for convert(): \"...\""` on a miss.

First caller: `Psych::ScalarScanner#parse_time`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/scalar_scanner.rb:123`,
`Rational("0.#{md[2]}")`). trails#8511 ported it in
`packages/ruby-compat/src/psych/scalar-scanner.ts` (`parseTime`) by building
the fraction from the digit string
(`rational(BigInt("0" + md[2]), 10n ** BigInt(md[2].length))`), because no
String arm existed.

MRI answers, checked with `ruby`: `Rational("0.")` is `(0/1)`,
`Rational("0.10")` is `(1/10)`, `Rational(" 1_0.5e1 ")` is `(105/1)`,
`Rational("1.5/3")` is `(1/2)`, and `""`, `"1/"`, `"1e"`, `"0x1"`, `"1 /3"`
raise ArgumentError.

## Acceptance criteria

- [ ] `rational()` accepts a String numerator and denominator, through ports of
      `read_sign`, `read_num`, `skip_ws`, `parse_rat` and `string_to_r_strict`
      at their MRI names, with the ArgumentError message above.
- [ ] `ScalarScanner#parseTime` calls `rational(\`0.${md[2]}\`)`as
`scalar_scanner.rb:123` does, and the digit-string construction is gone.
- [ ] `rational.trails.test.ts` covers the MRI answers listed above.
