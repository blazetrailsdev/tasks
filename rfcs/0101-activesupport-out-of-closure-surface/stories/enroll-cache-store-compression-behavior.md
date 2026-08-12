---
title: "Enroll Rails' CacheStoreCompressionBehavior for FileStore and MemoryStore"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6439
claim: "2026-08-12T21:56:49Z"
assignee: "converge-store-coder-ivar-and-retire-per-store-coders"
blocked-by: null
closed-reason: null
---

## Context

PR #6435 made FileStore compress by default (`Store#serialize_entry` →
`@coder.dump_compressed`, `activesupport/lib/active_support/cache.rb:806-813`,
`:295-299`) and gave MemoryStore's `DupCoder.dumpCompressed` a live path. Rails
covers all of that with a shared behavior module, `CacheStoreCompressionBehavior`
(`activesupport/test/cache/behaviors/cache_store_compression_behavior.rb:30-63`),
which every store test includes — FileStore at
`activesupport/test/cache/stores/file_store_test.rb:32-35`. trails has not
enrolled it, so #6435 shipped two trails-only tests
(`packages/activesupport/src/cache/file-store-compression.trails.test.ts`)
instead of the six Rails cases.

The Rails cases, verbatim: "compression by default", "compression can be
disabled", ":compress method option overrides initializer option", "low
:compress_threshold triggers compression", "high :compress_threshold inhibits
compression", ":compress_threshold method option overrides initializer option".

## Converged shape

Port `CacheStoreCompressionBehavior` as a shared describe helper the store test
files call (the trails spelling of Ruby's `include SomeBehavior`), with the six
`it` names matching Rails verbatim, and enroll FileStore and MemoryStore. The
`assert_compression` helper reads the stored payload and asserts on
`compressed?`. Delete `file-store-compression.trails.test.ts` once its two cases
are subsumed. Enrolling a new Rails test file needs its
`test:compare` registrations (see CONTRIBUTING).

## Acceptance criteria

- [ ] The six Rails compression-behavior test names are present verbatim and
      green for FileStore and MemoryStore.
- [ ] `file-store-compression.trails.test.ts` is deleted, not left alongside.
- [ ] `pnpm parity:test` delta non-negative.
