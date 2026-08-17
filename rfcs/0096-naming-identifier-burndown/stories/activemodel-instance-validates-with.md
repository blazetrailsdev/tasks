---
title: "activemodel-instance-validates-with"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Validations#validates_with` has TWO definitions in
`vendor/rails/activemodel/lib/active_model/validations/with.rb`:

- the class method (with.rb:88-105), which registers the validator and ends in
  `validate(validator, options)`; and
- the INSTANCE method (with.rb:143-151), which builds the validators on the spot
  and calls `validator.validate(self)` immediately, so a `validate :foo` body can
  do `validates_with MyValidator`.

`packages/activemodel/src/model.ts` ports only the class method (`static
validatesWith`, model.ts:733). There is no instance counterpart, so
`parity:api:calls:args` pairs the static body's callback-scoped
`validator.validate(record)` calls against the instance body's
`validator.validate(self)` and reports two `module-mixin-receiver` naming rows
that no rename can close (RFC 0096 wave-4-naming-mixin-receiver-rewire; the
call site carries a comment pointing here).

## Acceptance criteria

- [ ] `packages/activemodel/src/model.ts` gains an INSTANCE `validatesWith`
      mirroring with.rb:143-151 line for line: `options = args.extract_options!`,
      `options[:class] = self.class`, then per klass
      `klass.new(options.dup)` and `validator.validate(self)`.
- [ ] A test mirroring Rails' `test_passing_a_validator_instance_to_validates_with`
      / the `instance_validations` doc shape in
      `vendor/rails/activemodel/test/cases/validations/with_validation_test.rb`.
- [ ] The two `module-mixin-receiver` rows on `validates_with` are gone from
      `pnpm parity:api:calls:args:report`.
