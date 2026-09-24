---
title: "converge-cross-gem-top-level-constant-slots"
status: done
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: trails#8037
claim: "2026-09-24T16:14:54Z"
assignee: "activesupport-tse-util-imports-not-implemented-error-through-cache-store"
blocked-by: null
closed-reason: null
---

## Context

The Phase 3 bundle (`converge-activesupport-slots-onto-autoload`,
`converge-activemodel-and-actionview-slots-onto-autoload`,
`converge-actionpack-rack-session-trailties-slots-onto-autoload`) left five
slots in place. The operator deferred them because they share one design
question that has no settled trails shape yet: **where does a top-level Ruby
constant live when the gem reading it has no dependency on the gem that
defines it, or when the constant is the top-level `Rails` module itself?**
`Autoload` needs a namespace object to hang the constant on, and Ruby's
namespace here is `Object`.

Slots in scope (`packages/<pkg>/src/`):

- `activesupport: trails-slot.ts`: the `Rails` constant. Read by
  `actionpack/src/action-controller/log-subscriber.ts:72` for
  `message << "\n\n" if defined?(Rails.env) && Rails.env.development?`
  (`actionpack/lib/action_controller/log_subscriber.rb`). Seated by
  `trailties/src/rails.ts` via `_setTrails as _setTrailsConst`.
- `activesupport: trails-logger-slot.ts`: `Rails.logger`, read under a
  `defined?(Rails.logger)` guard by `deprecation.ts:41`
  (`deprecation/behaviors.rb`), `log-subscriber.ts:52`
  (`log_subscriber.rb`, `defined?(Rails) && Rails.respond_to?(:logger)`),
  and `testing/tagged-logging.ts:29` (`testing/tagged_logging.rb`). Once
  `Rails` has a home, this slot is just `Rails?.logger`, and `Trails.logger`
  becomes the plain `attr_accessor :logger` of `railties/lib/rails.rb:43`.
- `activesupport: action-dispatch-request-slot.ts`: `ActionDispatch::Request`
  for `activerecord/src/middleware/{shard,database}-selector.ts`
  (`activerecord/lib/active_record/middleware/shard_selector.rb:41`,
  `database_selector.rb:64`). activerecord does not depend on actionpack.
  Inside actionpack, `ActionDispatch.Request` is now autoloaded on
  `actionpack/src/namespaces.ts`, and the cross-gem seat should reuse that
  object.
- `actionview: routing-url-for-slot.ts`: `ActionDispatch::Routing::UrlFor`
  (the `super` target for `routing_url_for.rb:80-136`), plus the
  `ActionController::Parameters` and `HelperMethodBuilder` constants its body
  names. The `on_load(:action_controller)` hook already exists
  (`trailties/src/trailties/action-view.ts`, `railtie.rb:97-101`) and does
  `include(RoutingUrlFor, UrlFor)`. What is missing is a way for the
  included module's methods to be reached as `super`, and a home for the two
  cross-gem constants.
- `trailties: trails-slot.ts`: the `Rails` constant again, read by
  `engine.ts:215` (`engine.rb:592`, `Rails.env.local?`) and
  `engine/lazy-route-set.ts` (`lazy_route_set.rb:12-104`). The cycle is
  `rails.ts -> application.ts -> engine.ts`.

Options surfaced when this was deferred:

1. `globalThis` seats (`declare global { var Trails; var ActionDispatch }`):
   a top-level Ruby constant is a JS global, and `defined?(Rails.logger)` is
   `Trails?.logger`.
2. An `Autoload`-extended namespace object for Ruby's top-level `Object` in
   activesupport, with trailties seating `Object.Rails` and actionpack
   seating `Object.ActionDispatch`.

## Acceptance criteria

- The shape for a cross-gem / top-level constant is decided once and recorded
  in CLAUDE.md § "Call-time constant resolution".
- All five slot modules above are deleted, and their readers resolve the
  constant at call time. A read carries a guard only where Rails has a
  `defined?` guard (`log_subscriber.rb`, `deprecation/behaviors.rb`,
  `testing/tagged_logging.rb`, `action_controller/log_subscriber.rb`), and no
  guard elsewhere.
- `trailsLogger` / `_setTrailsLogger` are gone. `Trails.logger` is a plain
  accessor, and tests that stubbed the logger seat stub `Rails.logger`, as
  Rails' tests do.
- Plain-node imports of the built `dist/**.js` defining module and each reader
  as entry modules do not throw TDZ.
- `parity:api:extra:gate`, `parity:api:calls` and `:args` stay green.
