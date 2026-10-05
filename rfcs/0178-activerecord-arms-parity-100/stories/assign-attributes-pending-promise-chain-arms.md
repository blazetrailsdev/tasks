---
title: "activerecord: assign-attributes-pending-promise-chain-arms"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
