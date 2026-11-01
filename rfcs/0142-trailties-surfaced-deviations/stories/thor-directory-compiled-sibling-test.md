---
title: "thor-directory-compiled-sibling-test"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
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

`packages/thor/src/actions/directory.ts` `executeBang` skips a compiled `.tt.js` / `.tt.js.map` / `.tt.d.ts` beside its `.tt`, an arm `vendor/thor/v1.3.2/lib/thor/actions/directory.rb:85-96` lacks. Its only coverage is in `packages/trailties/src/generators/rails/plugin/plugin-generator.trails.test.ts`.

## Acceptance criteria

- A thor-package test covers both arms: a compiled sibling is skipped and a lone `*.tt.js` is copied.
