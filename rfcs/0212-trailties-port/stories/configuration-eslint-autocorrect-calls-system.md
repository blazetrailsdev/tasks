---
title: "configuration-eslint-autocorrect-calls-system"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
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

`apply_rubocop_autocorrect_after_generate!`
(`vendor/rails/v8.0.2/railties/lib/rails/configuration.rb`) calls `system`.
`applyEslintAutocorrectAfterGenerateBang` in
`packages/trailties/src/configuration.ts` uses a synchronous `spawnSync`.

## Acceptance criteria

- The body calls `rbFSystem`, awaited by the after-generate callback runner.
- The `@missingRailsCall system` receipt is removed.
