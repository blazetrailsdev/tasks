---
title: "Rescuable#rescue_from ports respond_to?(:===) and keys by klass.name"
status: in-progress
updated: 2026-10-25
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9297
claim: "2026-10-25T00:50:39Z"
assignee: "rescue-from-ports-respond-to-case-equals"
blocked-by: null
closed-reason: null
---

## Context

`Rescuable::ClassMethods#rescue_from` keys a handler by `klass.name` only when `klass.is_a?(Module) && klass.respond_to?(:===)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/rescuable.rb:63`). trails#9246 ported the `is_a?(Module)` half as `rbObjIsKindOf(klass, Module)` (`packages/activesupport/src/rescuable.ts`, `rescueFrom`), but the `respond_to?(:===)` half is not ported. The guard is also open-coded as a writable-`prototype` test for a JS class, rather than reading `is_a?(Module)` alone. The key is `name` when `safeConstantize(name) === klass`, else the class itself, which Rails does not do: Rails always stores `klass.name`.

## Acceptance criteria

- The first arm reads `rbObjIsKindOf(klass, Module) && rbObjRespondTo(klass, "caseEquals")` (Ruby `===`), in Rails' order, and the separate writable-`prototype` test is dropped if `rbObjIsKindOf` already answers a JS class.
- The key is `rbModName(klass)`, as Rails' `klass.name`, or the deviation keeping the class itself carries a receipt naming the language reason.
- A test registers a plain-object module without `caseEquals` and asserts the `ArgumentError` Rails raises (`rescuable.rb:67`).
