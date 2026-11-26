---
title: "Lint rule: a class's .name is not Module#name (use rbModName)"
status: draft
updated: 2026-11-26
rfc: "0000-parity-gates-catch-semantic-drift"
cluster: parity-gates
packages: [scripts, activesupport]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Design §3. `CurrentAttributes.currentInstancesKey` read `this.name` where
Rails reads `name.to_sym`
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/current_attributes.rb:174-176`).
JS `Function.name` is the short name, so `ActiveStorage::Current` and an app's
`Current` shared one key (fixed in trails#10792 with `rbModName`). The call gate
credits the `.name` read as Ruby's `name`, so nothing reported it.

## Acceptance criteria

- [ ] `blazetrails/no-function-name-as-module-name` reports a `.name` read on a value whose type is a class constructor (`typeof X`, `AnyClass`, `this` in a static member) in `packages/*/lib`, suggesting `rbModName`.
- [ ] An enrollment set (only-grow) lists the packages it runs in; activesupport is enrolled at landing.
- [ ] Existing hits in enrolled packages are converged or receipted with `@noRailsEquivalent`; no `eslint-disable`.
