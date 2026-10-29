---
title: "actionview: TagHelper/ActiveModelHelper/fixture modules drop defineModule for plain literals + markModuleObject"
status: draft
updated: 2026-10-29
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby `module TagHelper ... end` creates and names a module with no extra call. In trails#9422, `TagHelper` (`packages/actionview/src/helpers/tag-helper.ts:786`), `ActiveModelHelper` and `ActiveModelInstanceTag` (`helpers/active-model-helper.ts`), and the fixtures `AbcHelper` / `HelperyTestHelper` (`src/test/fixtures/helpers/`) are still wrapped in `defineModule(...)`. The repo owner wants every member public and no runtime private sections. The wrapper is only there to mark the object as a module (`isModuleObject`, `ruby-compat/src/classpath.ts`).

The converged shape was written on branch commit 9489ded3c7, which was never pushed:

- `TagHelper` is a plain object literal. Its own `include(TagHelper, CaptureHelper)` marks it.
- The other four are plain literals, each followed by `markModuleObject(X)`.
- `markModuleObject` is exported from `@blazetrails/ruby-compat`'s index.

## Acceptance criteria

- None of the five uses `defineModule`. No private or protected sections.
- tsc, the actionview helpers/template tests, `parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` and `parity:modules` are green.
