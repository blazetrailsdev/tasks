---
title: "Action Cable Redis adapter rescues CONNECTION_ERRORS, not ConnectionError"
status: claimed
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-22T16:34:07Z"
assignee: "cable-redis-connection-errors-converges-at-the-flip"
blocked-by: null
closed-reason: null
---

## Context

At `v8.0.5.2`, Rails replaces `ConnectionError = ::Redis::BaseConnectionError` / `ConnectionError = RedisClient::ConnectionError` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/subscription_adapter/redis.rb:213,247`) with `CONNECTION_ERRORS = [::Redis::BaseConnectionError].freeze` and a list holding `RedisClient::ConnectionError` (`vendor/rails/v8.0.5.2/actioncable/lib/action_cable/subscription_adapter/redis.rb:213,248-251`). The rescue site at `:167` changes to match. trails' `packages/actioncable/lib/subscription-adapter/redis.ts:317` still exports `class ConnectionError` and rescues it at `:212` and `:264`.

trails#10147 ledgers this as the bump ledger's one `kind: "constant"` row, so the extra-surface gate is green at the flip. `lint-extra-surface-ratchet.ts` reds the row once the TS name is gone.

## Acceptance criteria

- [ ] After the flip, `redis.ts` mirrors the v8.0.5.2 shape: a `CONNECTION_ERRORS` array, and the rescue tests membership in it.
- [ ] `ConnectionError` is removed. The constant ledger row is deleted in the same PR.
