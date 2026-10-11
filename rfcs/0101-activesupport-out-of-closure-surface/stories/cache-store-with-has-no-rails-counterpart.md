---
title: "Cache::Store.with has no Rails counterpart"
status: draft
updated: 2026-10-11
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

`packages/activesupport/src/cache/store.ts` has `static with(options: { logger }, fn)`, which
swaps `Store.logger` for the duration of a block. `ActiveSupport::Cache::Store`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:186-1040`) has no `with`; the
logger is the `cattr_accessor :logger` at `cache.rb:189` and callers assign it directly. A
reviewer on trails#8795 flagged it as trails-only surface.

## Acceptance criteria

- `Store.with` is deleted and its callers assign `Store.logger` the way the Rails tests do
  (save, assign, restore in `ensure`), or it is traced to a Rails method and renamed to it.
- `pnpm parity:api:extra --package activesupport` no longer lists it.
