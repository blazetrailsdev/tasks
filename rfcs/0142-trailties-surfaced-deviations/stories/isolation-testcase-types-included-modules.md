---
title: "trailties: type abstract-unit's included isolation modules on TestCase"
status: draft
updated: 2026-11-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/support/isolation/abstract-unit.ts:563-568` includes `Paths`, `Rack`, `Generation`, `Reload`, `Stream` and `MethodCallAssertions` into `TestCase` with `include()`. Its `declare module "@blazetrails/activesupport/test-case"` augmentation (`:584-588`) declares only `withEnv`. Isolation tests therefore build their host as `new XTest("test") as unknown as Generation` (`test/application/paths.test.ts`, `test/application/loading.test.ts` and others).

Rails' `isolation/abstract_unit.rb` gets this from `ActiveSupport::TestCase` including the modules (`vendor/rails/v8.0.5.2/railties/test/isolation/abstract_unit.rb`), so an instance answers `build_app` with no cast.

## Acceptance criteria

- The augmentation types every module `abstract-unit.ts` includes into `TestCase`, using `Included<>` or interface extends.
- Every `as unknown as Generation` / `Host` cast on an isolation `TestCase` instance under `packages/trailties/test/` is removed.
