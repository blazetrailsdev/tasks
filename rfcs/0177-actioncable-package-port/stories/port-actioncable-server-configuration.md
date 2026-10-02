---
title: "Port Server::Configuration and pubsub_adapter"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["actioncable-class-names-round-trip-through-constantize"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/configuration.rb` (70 lines), Tier 1. No Rails test file of its
own; `subscription_adapter/common.rb:18` and `server/health_check_test.rb`
drive it.

- Fourteen `attr_accessor`s in six lines (`:15-20`).
- `initialize` (`:22-35`): `@log_tags = []`, `@connection_class = -> {
ActionCable::Connection::Base }`, `@worker_pool_size = 4`,
  `@disable_request_forgery_protection = false`,
  `@allow_same_origin_as_host = true`, `@filter_parameters = []`, and
  `@health_check_application`, a lambda answering `[200, { Rack::CONTENT_TYPE
=> "text/html", "date" => Time.now.httpdate }, []]`.
- `pubsub_adapter` (`:40-67`): `cable.fetch("adapter") { "redis" }`,
  `require "action_cable/subscription_adapter/#{adapter}"`, two `LoadError`
  re-raise arms with different messages, then `camelize`, the
  `"Postgresql"` → `"PostgreSQL"` fix-up, and `constantize`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/configuration.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`require path_to_adapter`** loads the adapter file on demand (Zeitwerk is told `do_not_eager_load` for the directory, `lib/action_cable.rb:44`). In trails the adapter modules seat themselves on `ActionCable.SubscriptionAdapter`; the `require` becomes the namespace's autoload. `redis` and `postgresql` import optional peers, so they must not load until named here.
- [ ] **Two `LoadError` messages.** `e.path == path_to_adapter` means the adapter file itself is missing ("Could not load the '…' Action Cable pubsub adapter. Ensure that the adapter is spelled correctly in config/cable.yml…"); otherwise a dependency of the adapter is missing ("Error loading the '…' Action Cable pubsub adapter. Missing a gem it depends on? …"). A missing optional peer (`pg`, the Redis client) is the second arm. Both re-raise `e.class` with the original backtrace.
- [ ] **`cable.fetch("adapter") { "redis" }`** defaults only when the key is absent; a stored `nil` is returned as is. `cable` is nil until configured, so `fetch` on nil raises `NoMethodError`.
- [ ] **`cable` is read with String and Symbol keys** (`fetch("adapter")` here, `cable[:id]` and `cable[:channel_prefix]` in the adapters). Rails makes it a `HashWithIndifferentAccess` in the engine and in tests. Decide the key shape per RFC 0149 and apply it at all three sites.
- [ ] **`connection_class` is a lambda**, called on every request (`server/base.rb:41`). It names `Connection::Base` at call time.
- [ ] **`Time.now.httpdate`** is evaluated per call, inside the lambda.
- [ ] **`log_tags` and `filter_parameters` default to new arrays per instance**; the engine does `filter_parameters +=`.

## Acceptance criteria

- [ ] `configuration.rb` reads complete in `parity:api`.
- [ ] A `.trails.test.ts` covers the default adapter, the `PostgreSQL` fix-up, and both `LoadError` messages.
- [ ] Resolving `adapter: "async"` does not import the Redis or PostgreSQL adapter modules.

## Definition of done

A static import of every adapter from `configuration.ts` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/server/configuration.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
