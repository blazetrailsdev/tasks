---
title: "ruby-compat: Float::DIG is redeclared as a private constant at each site that names it"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activemodel", "activerecord"]
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

Surfaced in review of trails#8387. Rails names `::Float::DIG` at two sites, and trails spells it as a private `const FLOAT_DIG = 15` in each:

- `packages/activemodel/src/type/decimal.ts:19`, for `vendor/rails/v8.0.2/activemodel/lib/active_model/type/decimal.rb:91-92` (`precision.to_i > ::Float::DIG + 1`).
- `packages/activerecord/src/validations/numericality.ts:3`, for `vendor/rails/v8.0.2/activerecord/lib/active_record/validations/numericality.rb:7` (`[column_precision_for(record, attribute) || Float::DIG, Float::DIG].min`).

MRI defines it once: `rb_define_const(rb_cFloat, "DIG", INT2FIX(DBL_DIG))` at `vendor/ruby/v3.3.11/numeric.c:6283`. `packages/ruby-compat/src/numeric.ts`'s `floatRoundOverflow` also spells `15 + 2` for `DBL_DIG + 2` (`numeric.c:2546`).

The converged shape is one `Float.DIG` seat in `@blazetrails/ruby-compat` (with its `@noRailsEquivalent PERMANENT` receipt and MRI citation), read at all three sites as `Float.DIG`.

## Acceptance criteria

- [ ] `@blazetrails/ruby-compat` exports the constant once; neither `decimal.ts` nor `numericality.ts` declares its own.
- [ ] `floatRoundOverflow` reads it instead of the literal.
- [ ] `pnpm parity:api:extra:gate` stays green (the ruby-compat `total` mark moves only by a receipted member).
