---
title: "ScalarScanner's base-60 integer arm rounds past the safe-integer range"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Psych::ScalarScanner#tokenize`'s base-60 integer arm
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/scalar_scanner.rb:79-84`) sums
`n.to_i * 60 ** (e - 2).abs` over the `:`-separated fields. Ruby's Integer
arithmetic is exact, so a first field past 2^53 / 3600 still answers the exact
Bignum.

The port, `packages/ruby-compat/src/psych/scalar-scanner.ts` (`tokenize`,
trails#8511), computes `Number(rbStrToI(n)) * 60 ** Math.abs(e - 2)` in doubles.
`rbStrToI` (`packages/ruby-compat/src/string/convert.ts:80`) already answers
`number | bigint`; the arm narrows it. Same class of gap as
`kernel-integer-rounds-a-bignum-to-a-double`, which covers `parse_int`
(`scalar_scanner.rb:109-111`) and should land first so both arms answer a
Bignum the same way.

## Acceptance criteria

- [ ] The base-60 integer arm answers the exact value for a sum outside the
      safe-integer range, in the representation
      `kernel-integer-rounds-a-bignum-to-a-double` settles for `parseInt`.
- [ ] `scalar-scanner.trails.test.ts` covers `"9007199254740993:00:00"` against
      MRI's answer.
