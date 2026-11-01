---
title: "Port the Zeitwerk config and Cref tests that need the Loader"
status: draft
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - zeitwerk-reload-and-unload
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

trails `packages/zeitwerk/src/{ignore,collapse,push-dir,cref}.test.ts` park as `it.skip` every test that needs `setup`, `eager_load`, `reload` or `Cref#autoload`: `vendor/zeitwerk/v2.7.2/test/lib/zeitwerk/test_ignore.rb`, `test_collapse.rb` (all 11), `test_push_dir.rb` (the two `with_setup` tests), `test_cref.rb` (`#autoload?`, `#autoload`). `Registry.loader_for_gem` (`lib/zeitwerk/registry.rb:52`) is also unported because `GemLoader` is. `Cref#autoload` is the recorded row of RFC 0213 § "The ratified deviation".

## Acceptance criteria

- Every parked test runs with its Zeitwerk body, through the ported Loader.
- `Cref#autoload` / `#autoload?` and `Registry.loader_for_gem` are ported.
- No `it.skip` remains in those four files.
- `newLoader` and `teardown` in `packages/zeitwerk/src/test-helpers/loader-test.ts` regain `dirs:`, `namespace:`, `enable_reloading:`, `setup:` and `reset_constants` (`test/support/loader_test.rb:18-26`, `:48-52`).
