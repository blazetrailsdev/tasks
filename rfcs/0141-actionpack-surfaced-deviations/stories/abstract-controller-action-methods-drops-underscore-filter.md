---
title: "actionpack: AbstractController.actionMethods skips _-prefixed names, an arm Rails' public_instance_methods lacks (abstract_controller/base.rb:77-107)"
status: draft
updated: 2026-10-24
rfc: "0141-actionpack-surfaced-deviations"
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

`packages/actionpack/src/abstract-controller/base.ts:6-25` defines module-private helpers, `ownPublicMethodNames` and `allPublicMethodNames`, that skip any name starting with `_` and count only function-valued descriptors. Rails' `action_methods` / `internal_methods` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:77-107`) are `public_instance_methods(true) - internal_methods + public_instance_methods(false)`, with no underscore rule. Review of trails#9290 found the `_` filter is an arm Rails does not have and that no ruling backs it. `Channel::Base.actionMethods` (`packages/actioncable/src/channel/base.ts`) now uses ruby-compat's `publicInstanceMethods` (`packages/ruby-compat/src/include.ts:1577`) with no filter.

## Acceptance criteria

- [ ] `actionMethods` and `internalMethods` call ruby-compat's `publicInstanceMethods(klass, true|false)` and drop the `_` filter and the two module-private helpers.
- [ ] Any `_`-prefixed member a controller test depends on being hidden is made TS `private`, `#private`, or moved off the prototype, so `action_methods` tests still pass.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
