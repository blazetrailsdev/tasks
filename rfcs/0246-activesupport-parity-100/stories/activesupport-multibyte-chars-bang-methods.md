---
title: "activesupport: port or receipt Multibyte::Chars bang-method tests"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/rails/activesupport/test/multibyte_chars_test.rb` has 14 Miss. Each of 7 bang methods
(capitalize, downcase, lstrip, reverse, rstrip, swapcase, upcase) has a
"should return self when modifying wrapped string" test and a "should change
wrapped string" test. Both assert that the wrapped Ruby String is mutated in
place.

## Acceptance criteria

- [ ] Follow the ruling on RFC 0246 Open question 1. Either port the 14 tests
      onto `Chars`, which holds its own wrapped value, or park them as
      `it.skip` under `PERMANENT-SKIP:` that cites "Ruby Strings are JS
      string primitives".
- [ ] `multibyte_chars_test.rb` reaches 0 Miss.
