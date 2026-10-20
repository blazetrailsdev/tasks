---
title: "globalid: GlobalID#modelClass memoizes like @model_class ||="
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#9128
claim: "2026-10-20T13:37:58Z"
assignee: "call-args-pairs-string-new-with-rbstrsnew-in-mixed-new-bodies"
blocked-by: null
closed-reason: null
---

## Context

`GlobalID#modelClass` (`packages/globalid/src/global-id.ts`) recomputes `constantize(this.modelName)` on every read. Rails memoizes: `@model_class ||= begin ... end` (`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:56-65`).

## Acceptance criteria

- [ ] `modelClass` memoizes into a `_modelClass` field with `??=`, raising the same `ArgumentError` on first read.
