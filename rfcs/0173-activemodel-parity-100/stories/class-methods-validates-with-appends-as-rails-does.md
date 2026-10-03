---
title: "activemodel: ClassMethods.validatesWith appends to _validators as Rails does"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-03T22:56:10Z"
assignee: "class-methods-validates-with-appends-as-rails-does"
blocked-by: null
closed-reason: null
---

## Context

With `validations/with.ts`'s two `validatesWith` bodies each paired with its own Rails body, the
`ClassMethods` one reports a short-circuit mismatch `+or +or` in `pnpm parity:api:arms:report
--package=activemodel`. Rails' body
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/with.rb:88-107`) appends with
`_validators[attribute.to_sym] << validator`, with no `||`; the port's two
`set(…, get(…) ?? …)` writes are where the extra `or` tokens come from.

## Acceptance criteria

- [ ] `ClassMethods.validatesWith` appends as Rails does and the row leaves the arms report.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
