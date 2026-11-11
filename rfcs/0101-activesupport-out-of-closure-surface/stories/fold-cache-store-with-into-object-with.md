---
title: "Fold invented Store.with into objectWith (Object#with) and make it async-aware"
status: draft
updated: 2026-11-11
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

Rails has no `ActiveSupport::Cache::Store.with`. The tests call `Object#with`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/with.rb:26-39`)
with `Store` as the receiver. trails has a port of it, `objectWith`
(`packages/activesupport/lib/core-ext/object/with.ts`). `Store` also carries its own
`static with(options, fn)` (`packages/activesupport/lib/cache/store.ts:97`), which
restores only `logger`. trails#9984 made it wait for a thenable block result.

## Acceptance criteria

- [ ] `Store.with` is deleted. Callers (`test/cache/cache-logging-behavior.ts`'s
      `assertLogs`, `test/cache/serializer-with-fallback.test.ts`) call
      `objectWith(Store, { logger }, block)`.
- [ ] `objectWith` restores after a thenable block result settles, so an async block
      keeps Ruby's `ensure` span.
- [ ] The cache logging tests and `core-ext/object/with.test.ts` pass.
