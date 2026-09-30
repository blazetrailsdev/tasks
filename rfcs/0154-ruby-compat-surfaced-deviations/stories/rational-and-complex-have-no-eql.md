---
title: "Rational and Complex have no eql? (rbEql answers identity)"
status: draft
updated: 2026-09-30
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

`rbEql` (`packages/ruby-compat/src/rb-equal.ts`, the port of `rb_eql`, `vendor/ruby/v3.3.11/object.c:159`) dispatches to a receiver's `eql` method. trails#8271 added `Rational#equals` (`nurat_eqeq_p`, `rational.c:1128`) and `Complex#equals` (`nucomp_eqeq_p`, `complex.c:1225`) but no `eql`. So `rbEql(Rational(1, 2), Rational(1, 2))` answers `false` (identity), where Ruby answers `true`:

- `Rational#eql?` is `Numeric#eql?`, `num_eql` (`vendor/ruby/v3.3.11/numeric.c:1559`, defined at `:6168`): same class and `==`.
- `Complex#eql?` is `nucomp_eql_p` (`vendor/ruby/v3.3.11/complex.c:2590`).

This matters wherever a Rational or Complex is a Hash key or goes through `Array#uniq` / `Hash#eql?`, since both walk `rbEql` (`hash.c:3714` `eql_i`).

## Acceptance criteria

- [ ] `Rational#eql` mirrors `num_eql` (`numeric.c:1559`): same class, then `==`.
- [ ] `Complex#eql` mirrors `nucomp_eql_p` (`complex.c:2590`).
- [ ] Both carry MRI citations and `@noRailsEquivalent PERMANENT` receipts. A `.trails.test.ts` covers `rbEql` true for equal values and false across classes (`Rational(1, 1)` vs `1`).
