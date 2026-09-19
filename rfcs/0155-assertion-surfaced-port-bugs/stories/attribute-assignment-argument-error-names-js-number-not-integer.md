---
title: "attribute-assignment-argument-error-names-js-number-not-integer"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activemodel-attribute-cluster` (RFC 0132) while converging
`packages/activemodel/src/attribute-assignment.test.ts`.

Parked test: `an ArgumentError is raised if a non-hash-like object is passed`
(`it.skip` with
`BLOCKED: attribute-assignment-argument-error-names-js-number-not-integer`).
Rails: `activemodel/test/cases/attribute_assignment_test.rb:113-119`.

Rails asserts the message verbatim:

```ruby
assert_equal("When assigning attributes, you must pass a hash as an argument, Integer passed.", err.message)
```

`ActiveModel::AttributeAssignment#assign_attributes`
(`activemodel/lib/active_model/attribute_assignment.rb:19-21`) interpolates
`new_attributes.class`, and `1.class` is `Integer`.

trails builds the same message from `classOf(newAttributes)`
(`packages/activemodel/src/attribute-assignment.ts:139-146`), which returns the JS
constructor name — so `new Model(1)` raises
`… you must pass a hash as an argument, Number passed.` The assertion is landed with
Rails' literal and parked, because softening it to `Number` would leave a permanent
assertion-value mismatch against `attribute_assignment_test.rb`.

`classOf` also answers `"NilClass"` for `null` and `"Array"` for an array, so it is
already the place where JS values are named in Ruby terms; it just has no numeric
arm. Ruby names an integral value `Integer` and a fractional one `Float`, which is
the mapping the fix owes — and `ruby-compat` already knows it elsewhere (see the
`Integer`/`Float` handling around `kernel-integer.ts` / `kernel-float.ts`).

How far this story got: the converged body is landed and parked; no production code
was changed by the 0132 PR.

## Acceptance criteria

- [ ] `classOf` in `attribute-assignment.ts` names a JS number in Ruby terms —
      `Integer` when integral, `Float` otherwise — and `String`/`TrueClass`/
      `FalseClass`/`Symbol` are checked against MRI while the arm is being written
      (`ruby -e 'p 1.class'`).
- [ ] The parked test is unparked with its assertion unchanged and passes.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_assignment_test.rb`.
