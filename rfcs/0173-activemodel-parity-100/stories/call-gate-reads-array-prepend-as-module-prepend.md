---
title: "parity: the call gate reads Array#prepend as Module#prepend, so __update_callbacks carries a PERMANENT receipt for unshift"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8456
claim: "2026-10-03T20:52:08Z"
assignee: "call-gate-reads-array-prepend-as-module-prepend"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks::ClassMethods#__update_callbacks`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:691-696`) is
`self.descendants.prepend(self).reverse_each`. That `prepend` is `Array#prepend`,
an alias of `Array#unshift`, and the port writes `targets.unshift(this)`
(`packages/activesupport/src/callbacks.ts`, `ClassMethods.__updateCallbacks`).

The call gate (`pnpm parity:api:calls`) lists `unshift` among the generic names
it does not gate (`scripts/api-compare/lint-calls.ts`, near line 252) but not
`prepend`, so it reads the Ruby call as a ported method (`Module#prepend`) and
reports it missing. trails#8440 carries `@missingRailsCall prepend — PERMANENT`
on the method for that reason.

## Acceptance criteria

- [ ] The call gate credits a JS `.unshift(...)` on an array receiver as Ruby's `Array#prepend`, the way trails#8430 credited `.length` as `size`, without crediting `Module#prepend`.
- [ ] The `@missingRailsCall prepend — PERMANENT` receipt on `__updateCallbacks` is deleted and `pnpm parity:api:calls` stays green.
