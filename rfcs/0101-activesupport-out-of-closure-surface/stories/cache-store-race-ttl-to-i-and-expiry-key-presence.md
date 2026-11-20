---
title: "Cache::Store reads race_condition_ttl with to_i and expires_in/expires_at by key presence"
status: ready
updated: 2026-11-20
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two `ActiveSupport::Cache::Store` bodies in `packages/activesupport/lib/cache/store.ts` still differ from Rails:

- `handleExpiredEntry` reads `typeof options.raceConditionTtl === "number" ? options.raceConditionTtl : 0`, where Rails reads `options[:race_condition_ttl].to_i` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:1033`). A Duration (`10.seconds`) or a numeric string is coerced in Rails and silently becomes 0 in trails, and a Float is not truncated.
- `mergedOptions` tests `callOptions.expiresIn != null && callOptions.expiresAt != null`, where Rails tests `call_options.key?(:expires_in) && call_options.key?(:expires_at)` (`cache.rb:864`). An explicit `expiresAt: null` beside `expiresIn` raises in Rails and passes in trails.

## Acceptance criteria

- `race_ttl` is the `to_i` of the option, a Duration included (`Duration#to_i`), and a Float truncates.
- The both-supplied check uses key presence (`Object.hasOwn`), as `key?` does.
- activesupport cache and solid-cache suites pass.
