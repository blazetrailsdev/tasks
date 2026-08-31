---
title: "port-cache-store-logger-and-cache-entry-cases"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`). Two small cache test
files carry `it.skip` stubs with no RFC 0101 owner:

- `vendor/rails/activesupport/test/cache/cache_store_logger_test.rb:6`
  (`class CacheStoreLoggerTest`, 36 lines) — **4 stubs**. Covers
  `ActiveSupport::Cache::Store#logger` defaulting to
  `ActiveSupport::Cache.logger` and the silence/`logger = nil` arms.
- `vendor/rails/activesupport/test/cache/cache_entry_test.rb:6`
  (`class CacheEntryTest`, 22 lines) — **2 stubs**. Covers
  `ActiveSupport::Cache::Entry` value round-tripping and `#expired?`.

Distinct from `wire-cache-logging-behavior-into-helpers`, which owns
`cache/behaviors/cache_logging_behavior.rb` (the per-store instrumentation
module), not these two standalone files.

## Acceptance criteria

- The 6 stubs implemented against the real implementation — no stub left
  `it.skip`.
- Rails test names verbatim.
- `pnpm parity:test` deltas non-negative.
