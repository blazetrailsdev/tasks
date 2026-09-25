---
title: "Array#to_xml's all?(first.class) is is_a?, not class-name equality"
status: draft
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
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

`Array#to_xml` picks its root from `if first.class != Hash && all?(first.class)`
(`vendor/rails/activesupport/lib/active_support/core_ext/array/conversions.rb:189-190`).
`all?(pattern)` tests each element with `pattern === element`, and for a Class
that is `Module#===`, i.e. `element.is_a?(first.class)`. It is subclass-aware.

trails (`packages/activesupport/src/array-utils.ts`, `toXml`) spells it
`self.every((e) => rbObjClass(e) === rbObjClass(first))`: exact class-NAME
equality. So:

- an array whose later elements are subclasses of `first.class` answers
  `"objects"` in trails, where Rails pluralizes `first.class.name`;
- two distinct classes that share a `name` (anonymous or re-declared) are
  treated as the same class.

The Hash guard is also spelled `!isPlainObject(first)`, not `first.class != Hash`.
A `HashWithIndifferentAccess` first element is a Hash subclass, so in Rails
`first.class != Hash` is TRUE for it (HWIA != Hash). Check that the trails guard
agrees.

## Acceptance criteria

- [ ] The `all?` arm tests `is_a?` against `first.class`. Use `instanceof` of
      the first element's constructor, or the ruby-compat `===` / `is_a?`
      analogue if one exists, keeping Integer/Float for JS numbers as
      `rbObjClass` does. Do not compare class names.
- [ ] The Hash guard compares `first.class` against `Hash` exactly, as
      `conversions.rb:189` does.
- [ ] A trails test covers a subclass element and an HWIA first element, citing
      `conversions.rb:189-190`.
