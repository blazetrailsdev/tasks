---
title: "SecureRandom.random_number ports its Float, nil and Range arms"
status: draft
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SecureRandom.randomNumber` (`packages/ruby-compat/lib/secure-random.ts`) ports `Random::Formatter#random_number` (`rand_random_number` → `rand_random` → `rand_int`, `vendor/ruby/v3.3.11/random.c:1375`, `:1606`) for its positive-Integer-limit arm only, the arm `choose` needs. Ruby also answers a Float in `[0, 1)` for `nil`/`0`/no argument, a Float scaled by a Float limit, a member of a Range, and raises `ArgumentError` for a negative limit (`invalid_argument`).

## Acceptance criteria

- `randomNumber` ports `rand_random`'s Float, `nil`/0 and Range arms and the invalid-argument raise.
- The `CONVERGEABLE secure-random-random-number-remaining-arms` receipt on it is deleted.
- MRI's `test_random_number*` cases (`vendor/ruby/v3.3.11/test/ruby/test_random_formatter.rb`) that cover those arms are ported.
