---
title: "activemodel: port the 3 unported-register tests (Marshal / Rails-6 YAML errors)"
status: in-progress
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
deps:
  - ruby-compat-marshal-core-types
  - psych-load-and-safe-load
  - ruby-compat-marshal-load-core-types
  - errors-psych-loaded-symbol-attribute-does-not-match-added-attribute
  - attributes-marshal-round-trip-needs-usrmarshal-arm
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8525
claim: "2026-10-04T16:08:54Z"
assignee: "activemodel-port-marshal-and-yaml-error-tests"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts` holds three per-test activemodel exclusions:

- `attributes_test.rb` — "attributes with proc defaults can be marshalled" (`vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`),
  `Marshal.load(Marshal.dump(data))`.
- `errors_test.rb` — "errors are marshalable" (`vendor/rails/v8.0.2/activemodel/test/cases/errors_test.rb:670-678`) and
  "errors are compatible with YAML dumped from Rails 6.x".

The reasons say Ruby Marshal / Psych have no JS equivalent — no longer true: ruby-compat's Marshal is
`ruby-compat-marshal-core-types` (RFC 0154) and Psych is RFC 0170 (`psych-load-and-safe-load`).

## Scope

The two `errors_test.rb` cases merged in trails#8504 and trails#8516. The `attributes_test.rb` case
is split out: its un-skip and its `unscoped.ts` row are owned by
`attributes-marshal-round-trip-needs-usrmarshal-arm`, which depends on
`marshal-cannot-round-trip-rational-or-date` (ruby-compat's Marshal cannot round-trip `Rational`,
`Date` or a `Temporal.PlainDate`, all three of which the `date_field` default's dump carries). What
stays here is the activemodel side that case needs.

## Acceptance criteria

- [ ] The two `errors_test.rb` cases are ported with Rails' bodies and their unported entries deleted.
- [ ] `ActiveModel::Errors` round-trips through ruby-compat Marshal and Psych as Rails does.
- [ ] A model including `ActiveModel::Attributes` holds its set in the `@attributes` ivar
      (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb:107`), so
      `instance_variable_get(:@attributes)` answers it.
- [ ] `UserProvidedDefault#marshal_load` is an instance method mirroring
      `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute/user_provided_default.rb:40-49`.

## Verification

```bash
pnpm parity:test --package activemodel --missing && pnpm parity:test:assertions
```
