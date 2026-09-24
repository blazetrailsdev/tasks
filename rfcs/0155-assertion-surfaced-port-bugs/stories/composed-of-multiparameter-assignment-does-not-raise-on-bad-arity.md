---
title: "composed-of-multiparameter-assignment-does-not-raise-on-bad-arity"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8055
claim: "2026-09-24T21:03:36Z"
assignee: "move-mysql-foreign-keys-onto-abstract-mysql-adapter"
blocked-by: null
closed-reason: null
---

## Context

`Customer#address` is a `composed_of :address, class_name: "Address", mapping: [...]`
with three mapped parts (`vendor/rails/activerecord/test/models/customer.rb:5-9`,
ours `packages/activerecord/src/test-helpers/models/customer.ts:99-107`).

Rails' `execute_callstack_for_multiparameter_attributes`
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:40-52`)
calls `send("#{name}=", klass.new(*values))` inside a `rescue => ex` that
collects an `AttributeAssignmentError` per attribute and re-raises them as
`MultiparameterAssignmentErrors`. So handing `Address.new` the wrong number of
positional values raises `ArgumentError` in Ruby and surfaces as
`MultiparameterAssignmentErrors`.

trails does not raise. Two Rails tests in
`vendor/rails/activerecord/test/cases/multiparameter_attributes_test.rb` depend on it:

- `test_multiparameter_assignment_of_aggregation_with_missing_values` (:349-357) —
  `address(2)` + `address(3)` only, no `address(1)`.
- `test_multiparameter_assignment_of_aggregation_with_large_index` (:369-378) —
  `address(3000)`.

Both expect `assert_raise(ActiveRecord::MultiparameterAssignmentErrors)` and
`assert_equal("address", ex.errors[0].attribute)`. trails silently builds an
`Address` with `undefined`/missing parts, so the ports are parked `it.skip` with
`BLOCKED: composed-of-multiparameter-assignment-does-not-raise-on-bad-arity` in
`packages/activerecord/src/multiparameter-attributes.test.ts`.

## Acceptance criteria

- A `composed_of` multiparameter assignment whose value list does not fill the
  mapping (missing index, or an index beyond the mapping's length) raises
  `MultiparameterAssignmentErrors` whose `errors[0].attribute` is the
  aggregation name.
- The two parked tests above are un-skipped and pass.
