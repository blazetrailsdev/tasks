---
title: "activesupport: port or receipt Multibyte::Chars bang-method tests"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: []
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

`vendor/rails/v8.0.2/activesupport/test/multibyte_chars_test.rb` has 14 Miss. Each of 7 bang methods
(capitalize, downcase, lstrip, reverse, rstrip, swapcase, upcase) has a
"should return self when modifying wrapped string" test and a "should change
wrapped string" test. Both assert that the wrapped Ruby String is mutated in
place.

## Acceptance criteria

- [ ] Park the 14 tests as `it.skip` under a `PERMANENT-SKIP:` line that cites
      "Ruby Strings are JS string primitives (no mutable String carrier)".
      If `Chars` keeps its own wrapped value that the bang methods can
      reassign, port the tests instead, asserting on `chars.toString()`.
- [ ] `multibyte_chars_test.rb` reaches 0 Miss.
