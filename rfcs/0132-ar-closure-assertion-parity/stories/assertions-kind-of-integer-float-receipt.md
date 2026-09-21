---
title: "assertions-kind-of-integer-float-receipt"
status: claimed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-21T17:54:07Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Residue of `assertions-tail-root-2-rem-2` (RFC 0132). `attributes_test.rb ›
overloaded properties save` is the last mismatch in that file (rails 4 vs
trails 3; kinds: equal rails 2 / trails 3, instanceOf rails 2 / trails 0).

Rails (`vendor/rails/activerecord/test/cases/attributes_test.rb:35-46`):

    assert_equal 2, data.overloaded_float
    assert_kind_of Integer, OverloadedType.last.overloaded_float
    assert_equal 2.0, UnoverloadedType.last.overloaded_float
    assert_kind_of Float, UnoverloadedType.last.overloaded_float

trails (`packages/activerecord/src/attributes.test.ts:91-102`) reads
`Number.isInteger(...)` for the Integer arm (scores `equal`) and has no
Float arm at all: JS has one `number` type, so `2.0` and `2` are the same
value and no `Integer`/`Float` class exists to `toBeInstanceOf`.

The assertion comparer (`scripts/test-compare/assertion-kinds.ts`) is
name-only — it never sees the class argument of `assert_kind_of` — and
`scripts/test-compare/` has no per-test receipt mechanism, so there is
nowhere today to record a ratified language shortcoming for an assertion.

## Acceptance criteria

- Decide: (a) an arg-aware fold in `assertion-kinds.ts` scoring Rails
  `assert_kind_of Integer|Float, x` against the trails `Number.isInteger`
  shape, or (b) a reviewed receipt mechanism for assertion-kind shortfalls
  that are genuine TS language shortcomings.
- `attributes_test.rb` reports 0 count/kind mismatches, or carries the
  reviewed receipt. No rewritten or renamed assertion.
