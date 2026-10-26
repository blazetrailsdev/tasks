---
title: 'toS of a primitive -0 answers "-0.0" where Integer#to_s answers "0"'
status: draft
updated: 2026-10-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`toS(-0)` on a primitive `-0` answers `"-0.0"` (`packages/ruby-compat/src/object.ts:1768`: the integer fast path excludes `Object.is(flo, -0)` and falls into the Float formatter). `rbObjClass`'s doc (`object.ts:50-60`) says a primitive `-0` is an Integer, and only the boxed `new Number(-0)` is the Float `-0.0`, so `Integer#to_s` (`vendor/ruby/v3.3.11/numeric.c`, `int_to_s`) answers `"0"`. trails#9317 fixed `toI` returning `-0`, but any other JS integer arithmetic that yields `-0` (`0 * -1`, `Math.round(-0.4)`) still prints `-0.0`, as fugit's `to_long_s` did (`fugit/duration.rb:118`).

## Acceptance criteria

- [ ] `toS(-0)` answers `"0"`, and `toS(new Number(-0))` still answers `"-0.0"`.
- [ ] A ruby-compat trails test pins both.
