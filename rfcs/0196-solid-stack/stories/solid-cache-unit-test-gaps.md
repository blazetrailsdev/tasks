---
title: "Port solid_cache's remaining unit tests (encryption, query_cache, rails_cache, delete_matched, expiry, stats)"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache"]
deps: []
deps-rfc: []
est-loc: 300
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package solid-cache` (2026-11-16) lists these solid_cache v1.0.7 unit tests as unported:

- `unit/delete_matched_test.rb` (1), `unit/encryption_test.rb` (3), `unit/query_cache_test.rb` (3), `unit/rails_cache_test.rb` (1): no TS file yet.
- `unit/expiry_test.rb` 2 missing, `unit/stats_test.rb` 3 missing, `unit/solid_cache_test.rb` 1 missing (the non-behavior tests).
- `lib/generators/solid_cache/solid_cache/install_generator_test.rb` 1 skipped.

## Acceptance criteria

- Every listed test is ported at its Rails name into the expected TS file and runs on the three canonical adapters.
- `encryption_test.rb` runs over ActiveRecord encryption (`encrypts :key, :value`) as `SolidCache::Entry` does, with no stub.
- Any test that cannot be ported has an unported-register entry with a reason.
- At the end, `parity:test --package solid-cache` lists no missing or skipped test for these files.
