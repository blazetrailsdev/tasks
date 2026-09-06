---
title: "Enroll log_subscriber_test.rb's seven fragment-cache tests"
status: blocked
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: "2026-09-05T09:02:11Z"
assignee: "from-database-binary-value-is-not-frozen"
blocked-by: "Original blocker (port-actionview-cache-helper) is DISCHARGED: packages/actionview/src/helpers/cache-helper.ts landed in #7531 on origin/main. A deeper reason still holds — AbstractController::Caching is never mixed into ActionController::Base (git grep readFragment origin/main -- packages/actionpack/src finds only caching.ts, its own tests and the barrel; nothing assigns onto Base.prototype), so CacheHelper#cache cannot reach controller.read_fragment / write_fragment and no read_fragment.action_controller / write_fragment.action_controller notification is emitted from a controller action. Now blocked on include-abstract-controller-caching-into-action-controller-base (ready)."
closed-reason: null
---

## Context

`ActionController::LogSubscriber`'s four fragment-cache methods
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:77-88`) were
ported in #7501, but the seven Rails tests that exercise them are still
`it.skip` stubs in
`packages/actionpack/src/action-controller/controller/log-subscriber.test.ts`:

- `with fragment cache`
- `with fragment cache when log disabled`
- `with fragment cache if with true`
- `with fragment cache if with false`
- `with fragment cache unless with true`
- `with fragment cache unless with false`
- `with fragment cache and percent in key`

Their Rails counterparts are in
`vendor/rails/actionpack/test/controller/log_subscriber_test.rb` and drive a
real controller through `fragment_exist?` / `read_fragment` / `write_fragment`
with `ActionController::Base.enable_fragment_cache_logging` toggled, rather
than calling the subscriber directly. #7501 covered only the level
registrations and the `enable_fragment_cache_logging` early return, in the
trails-only file
(`controller/log-subscriber.trails.test.ts`, "the fragment cache methods log
nothing unless enable_fragment_cache_logging is on").

The blocker for the Rails tests is the harness, not the subscriber: they need a
caching controller with a cache store configured and the fragment helpers
reachable, which the existing log-subscriber test file does not set up.

## Acceptance criteria

- The seven tests are un-skipped and pass, keeping their Rails names verbatim.
- They drive the controller the way `log_subscriber_test.rb` does, not the
  subscriber directly.
- `pnpm parity:test` for `controller/log_subscriber_test.rb` moves up and the
  assertion-mismatch ratchet stays green.
