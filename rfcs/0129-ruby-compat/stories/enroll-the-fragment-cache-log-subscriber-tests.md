---
title: "Enroll log_subscriber_test.rb's seven fragment-cache tests"
status: ready
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
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
