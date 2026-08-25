---
title: "Enroll the remaining CacheStoreCompressionBehavior cases (format version, coder, serializer, compressor)"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6444
claim: "2026-08-12T23:36:53Z"
assignee: "test-compare-scans-rails-behavior-mixin-files"
blocked-by: null
closed-reason: null
---

## Context

PR #6439 enrolled six of the fourteen cases in
`activesupport/test/cache/behaviors/cache_store_compression_behavior.rb` — the
ones that need only `:compress` / `:compress_threshold`. The remaining eight all
depend on the serializer/coder layer or on `Cache.format_version`, and are
listed here with their Rails line numbers:

- `:10` "compression works with cache format version 7.0 (using Marshal70WithFallback)"
- `:15` "compression works with cache format version >= 7.1 (using Cache::Coder)"
- `:20` "compression is disabled with custom coder"
- `:25` "compression works with custom serializer"
- `:64` "compression ignores nil"
- `:69` "compression ignores incompressible data"
- `:74` "compressor can be specified"
- `:96` "compressor can be nil"
- `:100` "specifying a compressor raises when cache format version < 7.1"
- `:106` "specifying a compressor raises when also specifying a coder"

The first four and the last four need `with_format` (`ActiveSupport::Cache.with(
format_version:)`), the `:serializer` / `:compressor` options and
`validate_options`' two ArgumentError arms (cache.rb:912-925) — all owned by
`port-cache-store-coder-and-serializer-layer`. "compression ignores nil" and
"ignores incompressible data" need only `assert_not_compress`, which the helper
already has.

The helper to extend is
`packages/activesupport/src/cache/behaviors/cache-store-compression-behavior.ts`;
FileStore and MemoryStore already call it.

## Converged shape

The remaining ten `it` names present verbatim in the shared helper, with
`withFormat` ported against `Cache.formatVersion` /
`packages/activesupport/src/cache.ts`, and both store test files still enrolling
via a single call.

## Acceptance criteria

- [ ] All fourteen `CacheStoreCompressionBehavior` case names present verbatim
      and green for FileStore and MemoryStore.
- [ ] `pnpm parity:test` delta non-negative.
