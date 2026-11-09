---
title: "trails build lists config.helpersPaths entries outside app/helpers in the boot file map"
status: done
updated: 2026-11-09
rfc: "0224-aot-boot-files"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

## Context

trails#9901 made `trails build` (`packages/trails-tsc/lib/build-autoload.ts`, `writeBoot`) walk each engine's `paths().get("app/helpers").existent()` directories into the boot file map. At runtime, `helperConstants` (`packages/trailties/lib/trailties/action-controller.ts:156-193`) walks `app.config.helpersPaths`, which can also hold directories an application adds itself (`config.helpers_paths << ...`, Rails `action_controller.set_helpers_path` / `prepend_helpers_path` initializers). A helper under such a directory is not in the compiled-file map, so `loadIseqEval` fails with `Cannot find module` in a compiled app, as it did before #9901 for `app/helpers`.

## Acceptance criteria

- The boot file map lists the helper files under every directory in the booted application's `config.helpersPaths`, using the same walk as `helperFiles`.
- A test in `packages/trails-tsc/test/build-autoload.trails.test.ts` adds a helpers path outside `app/helpers` and checks its helper is registered.
