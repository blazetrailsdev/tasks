---
title: "to_f / fdiv / calculated Floats still hand back a bare number, not the Float seat"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8121 gave the boxed Float seat (`new Number(x)`, read as Float by `rbObjClass` / `floToS` in `packages/ruby-compat/src/object.ts`) its first producer, `ActiveModel::Type::Float#cast_value` (`packages/activemodel/src/type/float.ts`, `activemodel/lib/active_model/type/float.rb`). `float-seat-has-no-producer`'s converged shape also named the other seats Rails types as Float, and none of them produce it yet:

- `Integer#to_f` / `Numeric#fdiv` ports (`vendor/ruby/numeric.c` `int_to_f`, `rb_int_fdiv`). A whole result currently comes back as a bare `number`, which renders as an Integer.
- Float values returned by calculations that Rails types as Float, e.g. `average` on an integer column cast through `Type::Float` (`activerecord/lib/active_record/relation/calculations.rb` `type_cast_calculated_value`, the `"average"` arm).
- Float literals in ported bodies whose result is rendered (`to_s`, interpolation, `inspect`).

Consumers already accept the seat: `rbEqual` / `rbEql`, `cmp`, `quote` / `typeCast`, mysql `castBoundValue`, and `asJson`.

## Converged shape

Each of those producers returns `new Number(x)` for a whole-valued Float, so `rbObjAsString` renders `"2.0"` where Ruby does.

## Acceptance criteria

- [ ] Audit the ruby-compat and AR ports of `to_f` / `fdiv` / `Float(...)`-typed results. Each whole-valued result that reaches a renderer yields the seat.
- [ ] A test per producer pins `rbObjClass(x) === "Float"` and the `"N.0"` rendering.
- [ ] No arithmetic/comparison consumer regresses.
