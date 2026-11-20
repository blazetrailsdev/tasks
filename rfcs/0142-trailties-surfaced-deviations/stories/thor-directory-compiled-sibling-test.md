---
title: "thor-directory-compiled-sibling-test"
status: in-progress
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10433
claim: "2026-11-20T19:14:42Z"
assignee: "mailers-controller-view-paths-miss-app-views"
blocked-by: null
closed-reason: null
---

## Context

`packages/thor/src/actions/directory.ts` `executeBang` skips a compiled `.tt.js` / `.tt.js.map` / `.tt.d.ts` beside its `.tt`, an arm `vendor/thor/v1.3.2/lib/thor/actions/directory.rb:85-96` lacks. Its only coverage is in `packages/trailties/src/generators/rails/plugin/plugin-generator.trails.test.ts`.

## Acceptance criteria

- A thor-package test covers both arms: a compiled sibling is skipped and a lone `*.tt.js` is copied.
