---
title: "Port prefix_generation_test.rb and url_generation_test.rb skips and describe paths"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two files under `vendor/rails/v8.0.2/actionpack/test/dispatch/` match every test
by name, but every test is under the wrong describe and many are empty skips:

- `prefix_generation_test.rb` (45 tests; 21 skipped). Rails nests
  `WithMountedEngine` (`:26`) and `EngineMountedAtRoot` in
  `module TestGenerationPrefix` (`:7`). The extractor records the class alone
  (`withmountedengine > …`); trails' `dispatch/prefix-generation.test.ts`
  describes `TestGenerationPrefix::WithMountedEngine`. 20 skips are in
  `WithMountedEngine` (`:161-322`), 1 in `EngineMountedAtRoot` (`:390-450`).
- `url_generation_test.rb` (37 tests; 17 skipped). Same shape: `WithMountPoint`
  inside `module TestUrlGeneration`; all 17 skips in `WithMountPoint`
  (`:50-239`).

Both exercise mounted engines' `script_name`, `_routes` and
`default_url_options`.

## Acceptance criteria

- The describe blocks carry the names the extractor records, so all 82 tests
  leave "wrong describe".
- The 38 stubs are real tests with Rails' bodies.
- Both files report complete in `pnpm parity:test --package actiondispatch`.
