---
title: "Comparator: normalize the colon-prefixed Symbol spelling in call-argument literals (2 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6351
claim: "2026-08-11T11:44:28Z"
assignee: "call-args-tool-symbol-colon-literals"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass (PR #6348). Small but pure noise: a
Ruby Symbol argument is spelled in trails as a colon-prefixed string per the
CLAUDE.md convention (`:short` is `":short"`), and the literal normalizer in
`scripts/api-compare/literals.ts` does not know that, so it reports
`str:restrict_dependent_destroy.has_many` (Ruby) against
`str::restrict_dependent_destroy.has_many` (TS) as a value divergence.

Instances: `associations/has_many_association.rb` and
`associations/has_one_association.rb`, both in `handle_dependency` —
`errors.add(:base, :"restrict_dependent_destroy.has_many", record: ...)`.

Only 2 rows today, but every future port that carries a Symbol through the
convention seeds another.

## Acceptance criteria

1. The literal normalizer treats a TS string literal with a leading `:` as the
   Ruby Symbol of the same name when the Ruby side is a Symbol.
2. A TS string WITHOUT the colon still mismatches a Ruby Symbol — the colon is
   the discriminator the convention exists to preserve, and dropping it is a
   real divergence.
3. The 2 bucket-(b) rows go stale and are deleted from the baseline.
4. `pnpm parity:api:calls:args` is green.
