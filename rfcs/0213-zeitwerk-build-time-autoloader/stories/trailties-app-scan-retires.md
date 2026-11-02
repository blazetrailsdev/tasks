---
title: "Retire the application scan and enforce the file contract"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-railties
packages: ["trailties"]
deps: ["trailties-autoloaders-and-config-paths"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9612
claim: "2026-11-02T03:27:16Z"
assignee: "trailties-app-scan-retires"
blocked-by: null
closed-reason: null
---

## Context

`loadAppClasses`, `collectAppClasses`, `collectModels`, `loadControllers` in `packages/trailties/src/application/finisher.ts`. RFC 0213 § "Railties".

## Acceptance criteria

- The scan is deleted, and `defineController`'s `Helpers.inherited` call moves to an `on_load`.
- The finisher's `@missingRailsCall` receipts for `eager_load_all`, `eager_load!`, `after_class_unload` are gone.
- `trails new` emits the `autoload_lib` line.
- Repo app fixtures satisfy the file contract.
- `packages/trailties/CLAUDE.md` § "Trails has no autoloader" and its root pointer are rewritten.
