---
title: "activerecord: assign-attributes-pending-promise-chain-arms"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - reopen-rfc-0087-constructor-arm-for-association-io-at-assignment
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-08T12:23:18Z"
assignee: "default-scope-override-reads-the-default-scope-method-owner"
blocked-by: "No shape has Rails' arms only: _assign_attributes must run synchronously for new Foo({...}) (a JS constructor cannot await) AND sequence the promises HasOneAssociation#replace (has_one_association.rb:59-84, record.save at :76) and CollectionAssociation#ids_writer (collection_association.rb:65-84) return when reached from update/create, which Ruby runs in line inside the each (attribute_assignment.rb:9-19). JS has no synchronous await, so each continuation point (next pair, then assign_nested_parameter_attributes, then assign_multiparameter_attributes) needs a promise-or-value branch; an async body defers the scalar writes past sync readers, a generator plus two drivers or a sequencing helper only moves the same branches into invented surface, and starting the writers concurrently drops Rails' ordering. Same root blocker as update-must-call-assign-attributes-carried-from-0087: it converges only when association writers owe no I/O at assignment or assignAttributes may return a promise."
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-assignment.ts` `_assignAttributes` and
`assignNestedParameterAttributes` return `Promise<void> | void` and thread a `pending`
promise through the loop, so an awaitable `_assignAttribute` (an association writer reached
from `update` / `create`) is sequenced while the constructor path stays synchronous
(RFC 0087). Rails' bodies (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_assignment.rb:6-28`)
are a plain `each` with three arms and two trailing `if`s. The chain adds four `if`s to
`_assignAttributes` and two to `assignNestedParameterAttributes` in
`pnpm parity:api:arms:report --package=activerecord --direction=invented`; both carry
`@inventedArm if`.

## Acceptance criteria

- [ ] `_assignAttributes` has Rails' arms only: the `each` with `include?("(")` / `is_a?(Hash)` / else, then the two trailing `if`s.
- [ ] `assignNestedParameterAttributes` is `pairs.each { |k, v| _assign_attribute(k, v) }` with no `pending` arm.
- [ ] `new Foo({ ... })` still assigns synchronously and `update` / `create` still await association writes.
- [ ] Both `@inventedArm if` receipts are deleted and the invented report shows no row for either.
