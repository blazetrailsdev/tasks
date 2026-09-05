---
title: "prepare_value_for_validation tests with the in operator where Rails uses respond_to?/public_send"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`NumericalityValidator#prepare_value_for_validation`
(`activemodel/lib/active_model/validations/numericality.rb:125-137`) reaches
every raw-value reader through `respond_to?` + `public_send`:

```ruby
came_from_user = :"#{attr_name}_came_from_user?"

if record.respond_to?(came_from_user)
  if record.public_send(came_from_user)
    raw_value = record.public_send(:"#{attr_name}_before_type_cast")
```

trails (`packages/activemodel/src/validations/numericality.ts:250-266`) tests
with the `in` operator and reads the property directly:

```ts
const cameFromUser = `${attrName}CameFromUser`;
if (cameFromUser in r) {
  if (r[cameFromUser]) {
    rawValue = r[`${attrName}BeforeTypeCast`];
```

Three divergences follow. `in` walks the prototype chain and answers true for a
non-callable property, where `respond_to?` answers for a method; a generated
`*_came_from_user?` reader is a property in trails but `public_send` INVOKES it
in Ruby, so a reader implemented as a method rather than an accessor reads as a
truthy `Function` here; and `public_send` skips a private method where a
property read does not.

The `_read_attribute` → `readAttribute` half of this body was converged by
PR #7509 (story `numericality-prepare-value-reads-private-read-attribute`); this
is the remaining, larger half of the same three-arm dispatch, out of scope
there.

## Converged shape

The three reads go through the same respond-to-then-send shape the rest of the
file uses for a record-provided member, so a method-valued reader is called and
a non-callable property does not satisfy the guard.

## Acceptance criteria

- A record whose `*CameFromUser` is a method (not an accessor) takes the
  before-type-cast arm, as `public_send` does at `numericality.rb:129`.
- A record carrying a non-callable `*CameFromUser` property does not.
- Numericality suites green in activemodel and activerecord.
