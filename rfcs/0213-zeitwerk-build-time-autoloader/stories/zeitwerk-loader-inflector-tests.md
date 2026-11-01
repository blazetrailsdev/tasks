---
title: "zeitwerk-loader-inflector-tests"
status: in-progress
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - zeitwerk-setup-walk
  - zeitwerk-loader-config-and-helpers
  - zeitwerk-config-tests-through-loader
  - zeitwerk-eager-load-and-callbacks
deps-rfc: []
est-loc: null
priority: null
pr: trails#9592
claim: "2026-11-01T21:26:50Z"
assignee: "zeitwerk-loader-inflector-tests"
blocked-by: null
closed-reason: null
---

## Context

trails#9541 ported `test_inflector.rb` and `test_null_inflector.rb`. `vendor/zeitwerk/v2.7.2/test/lib/test_gem_inflector.rb` (3 tests) drives `Loader.for_gem`, and `test/lib/test_custom_inflector.rb` (2 tests) drives `loader.inflector=` and `setup`, so both wait for the Loader port. `GemInflector` has direct cover in `packages/zeitwerk/src/gem-inflector.trails.test.ts` until then.

## Acceptance criteria

- `gem-inflector.test.ts` and `custom-inflector.test.ts` port both files with Zeitwerk's test names verbatim, through the ported Loader.
- `parity:test` matches all 5 tests.
