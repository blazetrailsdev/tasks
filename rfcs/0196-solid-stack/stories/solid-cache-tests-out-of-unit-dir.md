---
title: "Move solid-cache tests out of test/unit/ so test:compare credits them"
status: done
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10150
claim: "2026-11-15T20:21:41Z"
assignee: "local-cache-middleware"
blocked-by: null
closed-reason: null
---

## Problem

solid-cache's ported tests sit under `packages/solid-cache/test/unit/` (expiry,
maglev-hash, solid-cache, clear, stats; landed in trails#10074 and trails#10089). The
solid-\* rule in `rubyToConventionTs` (scripts/test-compare/compare.ts, the
`solid-queue || solid-cable || solid-cache` branch) strips Rails' `unit/` segment, as
solid-queue's flat `test/` layout does. So 27 ported tests score `misplaced` instead of
`matched`. On main: 16/259 tests, 5/31 files.

Rails side: vendor solid_cache `test/unit/expiry_test.rb`, `test/unit/maglev_hash_test.rb`,
`test/unit/solid_cache_test.rb`, `test/unit/clear_test.rb`, `test/unit/stats_test.rb`.

## Shape

Move `packages/solid-cache/test/unit/*.test.ts` to `packages/solid-cache/test/`, matching
solid-queue and solid-cable, and fix imports. Mechanical renames only.

## Acceptance

`pnpm parity:test --package solid-cache` reports 0 misplaced for these files.
