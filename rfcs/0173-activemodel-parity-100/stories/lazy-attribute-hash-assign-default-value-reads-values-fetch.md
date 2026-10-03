---
title: "LazyAttributeHash#assign_default_value reads values.fetch with a block"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: "2026-10-03T11:55:23Z"
assignee: "bcrypt-generate-salt-reaches-bc-salt"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::LazyAttributeHash#assign_default_value`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:165-180`)
reads the value as

    value_present = true
    value = values.fetch(name) { value_present = false }

trails' `LazyAttributeHash#assignDefaultValue`
(`packages/activemodel/src/attribute-set/builder.ts`) instead branches on
`Object.hasOwn(this.values, name)` and indexes `this.values[name]`, so the
`values.fetch` call Rails makes is absent from the body.

trails#8340 converged the same two lines in `LazyAttributeSet#fetch_value` and
`#default_attribute` (`builder.rb:54,76`) onto ruby-compat's `fetch` with a
`block(...)`; this is the remaining copy in the file, left out of that PR's
scope.

## Acceptance criteria

- [ ] `assignDefaultValue` reads `fetch(this.values, name, rbBlock(() => {
valuePresent = false; }))`, matching `builder.rb:167-168`, with
      `let valuePresent: boolean = true`.
- [ ] No behaviour change: a stored `null` stays present, an absent key falls to
      the `types.key?` arm.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green, no new
      baseline row.
