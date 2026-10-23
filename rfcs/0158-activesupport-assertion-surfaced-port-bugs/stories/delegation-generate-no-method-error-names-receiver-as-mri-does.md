---
title: "activesupport: Delegation.generate's NoMethodError names the receiver as MRI does"
status: ready
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8869 (reviewer nit).

`packages/activesupport/src/delegation.ts` `Delegation.generate` raises `NoMethodError` from three generated shapes (the method, the `name=` setter and the accessor read) with the message

```ts
`undefined method '${method}' for ${String(_)}`;
```

`String(_)` renders a nil target as `null` (or `undefined`), and any other receiver through its `toString`. Rails generates a bare call (`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:114-118` for `nilable: false`, `:130-139` otherwise), so the message is MRI's own: `undefined method 'name' for nil` for a nil receiver and `undefined method 'name' for an instance of Customer` for an object.

`Delegation.generateMethodMissing` in the same file already spells the `for an instance of …` form.

## Acceptance criteria

- [ ] The three `NoMethodError` raises in `Delegation.generate` carry MRI's receiver description: `nil` for a nil target, `an instance of <Class>` for an object, through the ruby-compat helper that already renders it if one exists, rather than `String(_)`.
- [ ] `delegation.trails.test.ts` asserts the message for the nil-target `nilable: false` arms.
