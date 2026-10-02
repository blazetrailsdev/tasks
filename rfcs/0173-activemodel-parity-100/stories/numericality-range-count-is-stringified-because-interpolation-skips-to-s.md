---
title: "numericality: the RANGE_CHECKS count is pre-stringified because I18n interpolation skips to_s"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "i18n"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8415
claim: "2026-10-02T18:22:00Z"
assignee: "activerecord-node-guards-admit-attribute-and-sql-literal"
blocked-by: null
closed-reason: null
---

## Context

`NumericalityValidator#validate_each`'s `RANGE_CHECKS` arm
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:54-57`)
hands the Range itself to the error:

```ruby
unless value.public_send(RANGE_CHECKS[option], option_value)
  record.errors.add(attr_name, option, **filtered_options(value).merge!(count: option_value))
```

and the message `"must be in %{count}"` renders `1..3` because
`I18n.interpolate_hash` (`vendor/i18n/v1.14.8/lib/i18n/interpolate/ruby.rb:31-51`)
returns the value from a `gsub` block, which `to_s`es it (`rb_obj_as_string`).

`packages/activemodel/src/validations/numericality.ts` passes
`{ count: range.toS() }` instead, receipted
`@missingRailsArgs merge! — CONVERGEABLE numericality-range-count-is-stringified-because-interpolation-skips-to-s`.
Passing `optionValue` as Rails does renders `"Approved must be in [object Object]"`
(measured in `activemodel-audit-permanent-receipts-subdirs`):
`packages/i18n/src/interpolate/ruby.ts:49` stringifies with `String(value)`,
and ruby-compat's `rbObjAsString` (`packages/ruby-compat/src/object.ts:639`)
does not dispatch a ported `toS` either, so a `Range` (which has `toS`, no
`toString`) has no `to_s` on that path.

So the validator's pre-stringified `count` is a workaround for the interpolation
port, and the error's `options[:count]` is a String where Rails' is a Range —
observable through `errors.details`.

## Acceptance criteria

- [ ] `interpolateHash` renders a value through Ruby's `to_s` dispatch, so a
      ported object carrying `toS` (Range, Duration, …) interpolates as it does
      in Ruby.
- [ ] `validateEach` passes `count: optionValue` in the `RANGE_CHECKS` arm and
      the receipt is deleted; `errors.details` carries the Range.
- [ ] A trails test pins `"must be in 1..3"` for `validates_numericality_of … in: 1..3`.
- [ ] `pnpm parity:api:calls:args` green with no baseline row added.

## Verification

```bash
pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/validations/numericality-validation.test.ts packages/i18n/src
```
