---
title: "Store accessors module is a real included Module; delete module-carrier"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 8
pr: trails#8027
claim: "2026-09-24T13:07:19Z"
assignee: "test-bodies-lease-connection-per-test"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/store.ts:53` still fakes Rails' store accessors module
through `getOrCreateModuleCarrier` (`packages/activerecord/src/module-carrier.ts`,
`@noRailsEquivalent PERMANENT`). Rails' `_store_accessors_module`
(`activerecord/lib/active_record/store.rb`) is
`@_store_accessors_module ||= begin; mod = Module.new; include mod; mod; end`, and
`store_accessor` defines into it with `_store_accessors_module.module_eval do define_method ...`.
trails#7974 converged the same shape for enum (`EnumMethods extends Module` + `include()`),
leaving store as the last reader of `module-carrier.ts`.

## Acceptance criteria

- `_storeAccessorsModule` builds a ruby-compat `Module`, `include()`s it once per class
  (own-property memo), and store accessors are defined via `defineMethod`/`moduleEval`.
- `module-carrier.ts` and `getOrCreateModuleCarrier` are deleted.
