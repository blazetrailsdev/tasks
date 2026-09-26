---
title: "No Float cast produces the boxed Float seat, so whole-valued Float attributes still render as Integers"
status: ready
updated: 2026-09-25
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

trails#7785 let a whole-valued Float reach `rbObjClass` / `floToS` / `rbInspect` / `rbObjAsString` / `kernelFloat` (`packages/ruby-compat/src/object.ts`, `kernel-float.ts`) as a boxed `new Number(x)`, so `format("%s", new Number(1.0)) == "1.0"` as `flo_to_s` (`vendor/ruby/numeric.c:1059`) renders it. Nothing produces that seat: `ActiveModel::Type::Float#cast_value` (`activemodel/lib/active_model/type/float.rb`) and Float column reads still hand back a plain `number`, so a Float attribute holding `1.0` still interpolates as `"1"`.

## Converged shape

Every seat Rails types as Float (the Float type's cast, `Integer#to_f`/`fdiv` ports, Float literals in ported bodies that are rendered) reaches the render functions marked as a Float.

## Acceptance criteria

- [ ] At least the ActiveModel Float type's cast path yields the Float seat for a whole value, and a test pins `"#{1.0}"`-style rendering of such an attribute as `"1.0"`.
- [ ] Arithmetic/comparison consumers of those values are unaffected.
