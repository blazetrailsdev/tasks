---
title: "trailties-test-plugin-test-runner-and-engine"
status: claimed
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T22:44:51Z"
assignee: "trailties-test-application-configuration-harness-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split from trailties-test-test-runner-plugin-and-parser. No `PluginTestHelper` /
`PluginHelpers` port exists in `packages/trailties/test/support/` (Rails:
`vendor/rails/v8.0.5.2/railties/test/generators/plugin_test_helper.rb`,
`railties/test/plugin_helpers.rb`). Unported, all Miss:

- `vendor/rails/v8.0.5.2/railties/test/generators/plugin_test_runner_test.rb` (11): runs the
  generated plugin's `bin/test` in a subprocess.
- `vendor/rails/v8.0.5.2/railties/test/generators/test_runner_in_engine_test.rb` (2): `--full`
  plugin, `bin/trails test`, rerun snippet relative path.

Model the subprocess shape on `packages/trailties/test/application/test-runner.test.ts`.

## Acceptance criteria

- [ ] Port `generatePlugin` / `pluginFile` / `createTestFile` helpers at their Rails names.
- [ ] Both files matched with no Miss in `pnpm parity:test -- --package trailties`.
