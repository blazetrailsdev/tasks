---
title: "trailties' Rails module is seated as Trails while its class paths say Rails::"
status: draft
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailties' `Rails` module is seated as `Trails` (`packages/trailties/src/rails.ts:155-156`, `TopLevel.Trails = Trails; registerConstant("Trails", Trails)`), while `packages/trailties/src/class-paths.generated.ts:36-37` names its classes `Rails::HealthController` / `Rails::InfoController`. So `rbModName(InfoController)` is `Rails::InfoController`, but `constantize("Rails::InfoHelper")` raises `uninitialized constant Rails`, because no `Rails` constant exists. In Ruby, `module Rails` is a top-level constant (`rb_define_module`).

On trails#9406, switching `defaultHelperModuleBang` (`packages/actionpack/src/abstract-controller/helpers.ts:212`) to `rbModName(this)` (Rails: `name.delete_suffix("Controller")`, `vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:237-242`) made every `Rails::*Controller` 500. The `NameError` is for `Rails`, not for `Rails::InfoHelper`, so `missing_name?` does not swallow it. The change was reverted. It blocks `helpers-anonymous-and-default-helper-read-js-name`.

## Acceptance criteria

- [ ] `constantize("Rails")` and `rbPathToClass("Rails")` resolve trailties' Rails module, and `rbModName` of it agrees with its classes' generated paths.
- [ ] `missingName()` for a miss under it answers `Rails::<Name>`.
- [ ] `info-controller.test.ts` and `boot-app-health.trails.test.ts` pass with `defaultHelperModuleBang` reading `rbModName`.
