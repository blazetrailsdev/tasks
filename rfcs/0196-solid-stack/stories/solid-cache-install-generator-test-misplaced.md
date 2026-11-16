---
title: "solid-cache install generator test is misplaced for test-compare"
status: draft
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package solid-cache` reports 2 misplaced tests: the install generator tests. Rails' file is `vendor/solid_cache/v1.0.9/test/lib/generators/solid_cache/solid_cache/install_generator_test.rb`. `rubyToConventionTs` (`scripts/test-compare/compare.ts`, solid-\* branch) strips the leading `lib/` and expects `packages/solid-cache/test/generators/solid-cache/solid-cache/install-generator.test.ts`. The port lives at `packages/solid-cache/test/lib/generators/solid-cache/solid-cache/install-generator.test.ts`, so its 2 tests ("generator updates environment config", "generator creates SQL structure file when schema_format is sql") are not credited.

## Acceptance criteria

- Converge one side: either move the test to the path test-compare expects (and update the `vitest.config.ts` trailties-lane include/exclude for `packages/solid-cache/test/lib/generators/**`, plus the fixture path `../../../../fixtures/generators/dummy_app`), or make the solid-cache mapping keep `lib/` the way the Rails tree does.
- `parity:test --package solid-cache` reports 0 misplaced and credits both generator tests.
