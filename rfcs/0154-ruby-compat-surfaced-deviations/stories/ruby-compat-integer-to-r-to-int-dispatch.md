---
title: "Integer#to_r / #to_int dispatchable by name on JS numbers"
status: draft
updated: 2026-10-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjRespondTo(30, "toR")` and `rbObjRespondTo(30, "toInt")` both answer false, and `rbFSend(30, "toR")` raises `undefined method 'toR' for an instance of Integer`. ruby-compat has no method table for JS numbers (`packages/ruby-compat/src/object.ts`, around `sendInternal` / `basicObjRespondTo`). MRI's `Integer#to_r` (`vendor/ruby/v3.3.11/rational.c`, `integer_to_r`) and `Integer#to_int` (`numeric.c`, `int_to_i`) are therefore unreachable by name. `num_exact_check`'s `rb_check_funcall(v, idTo_r)` path (`vendor/ruby/v3.3.11/time.c:518-559`) needs both, as does a Duration delegating through `method_missing` (`activesupport/lib/active_support/duration.rb:512-518`).

## Acceptance criteria

- `rbObjRespondTo` and `rbFSend` answer `toR` and `toInt` for an integer number or bigint, returning a `Rational` and the integer.
- Float `toR` follows `float_to_r`.
- ruby-compat tests cover both.
