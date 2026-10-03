---
title: "parity: the unshift credit for Array#prepend accepts any local or expression receiver"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8456 added `["prepend", { form: "unshift", receivers: "explicit" }]` to
`NATIVE_FORM_ANALOGUES` (`scripts/api-compare/enumerable-idioms.ts`), so a TS `.unshift(...)` call
credits Ruby's `Array#prepend` (`vendor/ruby/v3.3.11/array.c:8640`). The credit refuses the
receiver kinds `self`, `const` and unproven `ivar`, and makes no receiver-name match, because
`__update_callbacks`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:691-696`) chains
`self.descendants.prepend(self)` where the port must hold the array in a local.

So a `Module#prepend` off a local or an expression (`klass.prepend(mod)`,
`singleton_class.prepend(mod)`) is credited whenever the paired TS body also makes any
`.unshift(...)` call. No body does today.

## Converged shape

The Ruby extractor (`scripts/api-compare/extract-ruby-api.rb#receiver_kind`) proves the receiver
of a credited `prepend` an Array (an `array` kind, or a chain ending in an Array-returning method
such as `descendants`), and the credit is refused for every other kind.

## Acceptance criteria

- [ ] `significantCallsForReceivers({ prepend: ["local"] }, undefined, new Set(["unshift"]))`
      keeps `prepend` significant.
- [ ] `ClassMethods.__updateCallbacks` (`packages/activesupport/src/callbacks.ts`) stays credited
      with no `@missingRailsCall` receipt, and `pnpm parity:api:calls` is green.
