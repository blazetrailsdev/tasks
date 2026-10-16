---
title: "activemodel/activerecord: NumericalityValidator#validateEach takes precision and scale positionally where Rails takes keyword arguments"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
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

Rails takes `precision` and `scale` as keyword arguments on both `validate_each` methods:

- `ActiveModel::Validations::NumericalityValidator#validate_each(record, attr_name, value, precision: Float::DIG, scale: nil)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:36`).
- `ActiveRecord::Validations::NumericalityValidator#validate_each(record, attribute, value, precision: nil, scale: nil)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/validations/numericality.rb:6`), which calls `super(record, attribute, value, precision: precision, scale: scale)` (`:9`).

trails takes them positionally in activemodel, `validateEach(record, attrName, value, precision = 15, scale?)` (`packages/activemodel/src/validations/numericality.ts:66`). The activerecord override drops both parameters, `validateEach(record, attribute, value)` (`packages/activerecord/src/validations/numericality.ts:6`), and passes them on positionally (`:9`).

Under the trails kwargs idiom, a Ruby keyword argument is a trailing options object, so the faithful shape is `validateEach(record, attrName, value, { precision = FLOAT_DIG, scale = null } = {})`. The activerecord codegen spike's generated `super` call in that shape fails to type-check against the current signature.

## Acceptance criteria

- [ ] activemodel `validateEach` takes `{ precision, scale }` as a trailing options object, with `precision` defaulting to `Float::DIG` (15) and `scale` to `null`. The default applies only when the key is absent, not when a caller passes `null` explicitly (CLAUDE.md, "kwargs").
- [ ] activerecord `validateEach` declares the same options object at Rails' position and passes `{ precision, scale }` to `super`.
- [ ] Every other caller of `validateEach` on a numericality validator passes the options object.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` show no new row. Any row this converges is deleted by hand.

## Verification

```bash
pnpm parity:api:calls:args && pnpm parity:api:params && pnpm vitest run packages/activemodel/src/validations/numericality packages/activerecord/src/validations/numericality
```
