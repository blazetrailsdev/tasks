---
title: "Enroll log_subscriber_test.rb's seven fragment-cache tests"
status: blocked
updated: 2026-09-05
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
blocked-by: "Blocked on port-actionview-cache-helper. The seven Rails tests (vendor/rails/actionpack/test/controller/log_subscriber_test.rb:330-393) drive controller actions that render inline templates calling cache / cache_if / cache_unless (log_subscriber_test.rb:51-72), and ActionView::Helpers::CacheHelper (vendor/rails/actionview/lib/action_view/helpers/cache_helper.rb) is not ported — packages/actionview/src/helpers/ has no cache-helper.ts and nothing in packages/ names CacheHelper. With no helper nothing emits the read_fragment/write_fragment notifications the subscriber methods subscribe to, so the tests cannot be written the way Rails writes them and the acceptance criterion 'drive the controller the way log_subscriber_test.rb does, not the subscriber directly' is unreachable. Inline rendering itself is fine (packages/actionview/src/renderer/template-renderer.ts:40-42) and the controller-side fragment primitives exist (packages/actionpack/src/abstract-controller/caching.ts), so the helper port is the whole gap. Filed port-actionview-cache-helper under 0129-ruby-compat."
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
