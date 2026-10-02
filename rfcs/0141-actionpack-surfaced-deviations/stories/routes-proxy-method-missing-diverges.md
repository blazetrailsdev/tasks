---
title: "RoutesProxy#method_missing is split into a Proxy trap and an invented _dispatch"
status: draft
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RoutesProxy` (`packages/actionpack/src/action-dispatch/routing/routes-proxy.ts`)
ports `respond_to_missing?` since trails#8410, but its `method_missing` half
still diverges from
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/routes_proxy.rb:30-63`:

- Rails' `method_missing(method, *args)` (`:30-48`) is one method. trails
  splits it between a Proxy `get` trap in the constructor and an invented
  `_dispatch(method, args)`.
- The guard is `@helpers.respond_to?(method)` (`:31`). The `get` trap tests
  `typeof target._helpers[prop] === "function"` and the `has` trap tests
  `prop in target._helpers`; neither is `rbObjRespondTo(this._helpers, method)`,
  which is what `respondToMissing` now answers with.
- The `else` arm is `super` (`:46`), a `NoMethodError`. `_dispatch` throws a
  hand-written `TypeError("undefined helper '…' on RoutesProxy")`.
- `options = args.extract_options!` (`:32`) is a module-private
  `extractOptions` re-implementation; activesupport already exports
  `extractOptionsBang` (`mapper.ts` imports it).
- `merge_script_names` (`:55-63`) is a private method; trails has an exported
  module function `mergeScriptNames` plus an invented `countSlashes` helper
  where Rails calls `String#count("/")`.
- `alias :_routes :routes` (`:13`) is a getter/setter pair whose setter drops a
  `null` write.

## Acceptance criteria

- `methodMissing(method, ...args)` is one method mirroring `:30-48` line for
  line, reached from the Proxy trap; `_dispatch` is gone and the missing arm is
  `super`'s `NoMethodError`.
- The trap and `respondToMissing` share the `@helpers.respond_to?` test.
- `extractOptionsBang` replaces `extractOptions`; `mergeScriptNames` is the
  private method `merge_script_names` and `countSlashes` is gone.
- `pnpm parity:api:calls`, `parity:api:calls:args` and
  `parity:api:extra --package actiondispatch` show no row for `routes-proxy.ts`.
