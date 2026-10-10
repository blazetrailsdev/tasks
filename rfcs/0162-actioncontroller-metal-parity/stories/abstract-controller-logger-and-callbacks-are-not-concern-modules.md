---
title: "AbstractController::Logger and Callbacks are not Concern modules; Callbacks is included from AbstractController"
status: in-progress
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8754
claim: "2026-10-10T12:39:39Z"
assignee: "database-tasks-env-memoizes-to-s-and-db-dir-expands-by-hand"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Redirecting` and `ActionController::Instrumentation` both
`include AbstractController::Logger` at module level
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:9`,
`metal/instrumentation.rb:19`). In trails
`packages/actionpack/src/abstract-controller/logger.ts`'s `Logger` is still a
class carrying only `static [included]`, so it cannot be a Concern dependency:
both modules reach it from a symbol-keyed `[included]` hook
(`metal/redirecting.ts`, `metal/instrumentation.ts`) that runs
`include(base, Logger)` against the includer.

`AbstractController::Callbacks` has the same shape
(`packages/actionpack/src/abstract-controller/callbacks.ts`, a plain object with
`[included]`), and it is included into `AbstractController` itself
(`abstract-controller/base.ts`, `include(AbstractController, Callbacks)`), where
Rails includes it only from `ActionController::Base::MODULES` and
`ActionController::API::MODULES`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:133`,
`abstract_controller/callbacks.rb:28-37`). `api.ts` now includes it again in
`MODULES` order, so its `included` block runs a second time for `API`.

`ActionController::Flash`'s `delegate :flash, to: :request`
(`metal/flash.rb:14`) is a hand-defined getter in `metal/flash.ts`'s `included`
block, and `ClassMethods#action_methods` (`metal/flash.rb:55-57`) calls
`AbstractController.actionMethods` by name where Rails calls `super`.

## Acceptance criteria

- `AbstractController::Logger` is a `Module` extended with `Concern`, with
  `config_accessor :logger` and `include ActiveSupport::Benchmarkable` in its
  `included` block (`abstract_controller/logger.rb`), and `Redirecting` /
  `Instrumentation` `include` it at module level with no `[included]` hook.
- `AbstractController::Callbacks` is a `Module` extended with `Concern`, included
  from `Base` and `API` in `MODULES` order and not from `AbstractController`.
- `Flash::ClassMethods#action_methods` reaches the next definition through
  `superMethod`.
