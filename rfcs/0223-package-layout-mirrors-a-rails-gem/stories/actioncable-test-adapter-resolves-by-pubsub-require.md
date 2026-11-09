---
title: "actioncable test adapter resolves through pubsub_adapter's require, not a test_help import"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9936
claim: "2026-11-09T22:53:48Z"
assignee: "actioncable-test-adapter-resolves-by-pubsub-require"
blocked-by: null
closed-reason: null
---

## Context

trails#9916 moved `@blazetrails/actioncable`'s `test` subscription adapter off the server path (RFC 0223). Rails resolves any adapter in `Server::Configuration#pubsub_adapter` by `require "action_cable/subscription_adapter/#{adapter}"` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/configuration.rb:40-60`), so `adapter: test` (Rails' default test `cable.yml`) works with no other load.

In trails the entry was dropped from `BUILT_IN_ADAPTERS` (`packages/actioncable/lib/server/configuration.ts`). `packages/actioncable/lib/subscription-adapter/test.ts` now seats `SubscriptionAdapter.loadPath["action_cable/subscription_adapter/test"]` itself, and `packages/trailties/lib/test-help.ts` imports `@blazetrails/actioncable/subscription-adapter/test` so a test env resolves it. Rails' `rails/test_help.rb` has no such require; the import is invented.

## Converged shape

`pubsub_adapter`'s `require` reaches the test adapter through the adapter path alone, as Rails does, without the module joining the non-testing export closure. One option is a load-path entry that resolves `action_cable/subscription_adapter/test` to the package's testing subpath export, so `scripts/layout/server-path-closure.ts` sees it as a testing entry reached only by a load-by-name. Another is an owner ruling that the `test` adapter is server code, not testing code.

## Acceptance criteria

- [ ] `adapter: "test"` resolves through `Server::Configuration#pubsub_adapter` with no import in `trailties/lib/test-help.ts`.
- [ ] `server-path-closure` stays green with no actioncable row.
