---
title: "zeitwerk-gem-inflector-tests-through-for-gem"
status: draft
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - zeitwerk-config-tests-through-loader
  - zeitwerk-eager-load-and-callbacks
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

`packages/zeitwerk/src/gem-inflector.test.ts` parks all 3 tests of `vendor/zeitwerk/v2.7.2/test/lib/test_gem_inflector.rb`. They need `Loader.for_gem` (`lib/zeitwerk/loader.rb:389`), `GemLoader` (`lib/zeitwerk/gem_loader.rb`), `Registry.loader_for_gem` (`registry.rb:52`), a load of the constants, and `GemInflector` matching `.ts` root files: it still uses `.rb` (`packages/zeitwerk/src/gem-inflector.ts:9-11`). `for_gem` also reads `caller_locations`, which ruby-compat lacks.

## Acceptance criteria

- `gem-inflector.test.ts` runs all 3 tests with Zeitwerk's bodies, with no `it.skip`.
- `GemInflector` recognises a `.ts` version file.
