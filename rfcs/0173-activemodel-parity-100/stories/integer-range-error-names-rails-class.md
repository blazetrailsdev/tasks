---
title: "Integer RangeError message names the Rails class (self.class), not the JS class"
status: in-progress
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8411
claim: "2026-10-02T17:22:05Z"
assignee: "tests-without-assertions-reads-an-invented-source-location-seat"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Integer#ensure_in_range` raises
`"#{value} is out of range for #{self.class} with limit #{_limit} bytes"`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/integer.rb:93-98`), so
the message names the Ruby class: `ActiveModel::Type::Integer`,
`ActiveRecord::Type::UnsignedInteger`, and so on.

trails' `IntegerType#ensureInRange` (`packages/activemodel/src/type/integer.ts`)
interpolates `this.constructor.name`, the JS class name, so the message reads
`… out of range for IntegerType with limit 8 bytes`. Tests pin that invented
spelling (`integer.trails.test.ts`, added in trails#8276).

## Converged shape

Interpolate Ruby's `self.class`, i.e. the registered constant name
(`registerConstant("ActiveModel::Type::Integer", IntegerType)` already
exists; ruby-compat `rbModToS` / activesupport `registeredConstantName`).

## Acceptance criteria

- [ ] The RangeError message names `ActiveModel::Type::Integer` / the subclass's registered Rails constant, as `integer.rb:95` does.
- [ ] Tests asserting `for IntegerType with limit` are updated to the Rails spelling.
