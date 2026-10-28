---
title: "default-helper-module-reads-rbmodname-once-outer-constants-resolve"
status: draft
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
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

`AbstractController::Helpers::ClassMethods#default_helper_module!`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb`) builds
`helper_prefix` from `name.delete_suffix("Controller")`, which is `Module#name`.
trails' `defaultHelperModuleBang` (`packages/actionpack/src/abstract-controller/helpers.ts`)
still reads JS `this.name`.

trails#9411 switched it to `rbModName(this)`, and CI went red in actionpack,
actionview and trailties: `NameError: uninitialized constant ViewLoadPathsTest`
(`packages/actionview/src/actionpack/controller/view-paths.test.ts`),
`PermissionsPolicyWithHelpersIntegrationTest`, `PageDumpIntegrationTest`,
`IntegrationFileUploadTest`, and `uninitialized constant Rails` in trailties. Those
controllers have a qualified `rbModName` (`Outer::FooController`), but `Outer` is
never seated as a constant. So `constantize("Outer::FooHelper")` raises for
`Outer`, while Ruby raises for `Outer::FooHelper`, which `missing_name?`
swallows.

## Acceptance criteria

- [ ] Every test-side outer class whose nested controller gets a qualified `rbModName` resolves through `rbModConstGet` (registered), or the path is otherwise made reachable, so `constantize` raises for the leaf constant as Ruby does.
- [ ] `defaultHelperModuleBang` derives `helper_prefix` from `rbModName(this)`.
- [ ] The actionpack, actionview and trailties tests named above pass.
