---
title: "Name ActionController::Parameters at module eval without a const_set seat for its YAML hook"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters.hook_into_yaml_loading` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`, invoked from the class body) registers `YAML.load_tags[...] = name`. Ruby already knows the class's full path at that point. In trails, `Parameters.hookIntoYamlLoading()` runs at module eval, at the bottom of `packages/actionpack/src/action-controller/metal/strong-parameters.ts`, before any generated class-path table is loaded. So trails#9376 kept `rbModConstSet(ActionController, "Parameters", Parameters)` there, a seat with no Rails `const_set`. Without it the YAML load tags read bare `Parameters`, and `ParametersSerializationTest > YAML backwardscompatible with psych 2.0.8 format` raises `undefined class/module Parameters`.

## Acceptance criteria

- [ ] `rbModName(Parameters)` answers `ActionController::Parameters` at module eval without `rbModConstSet`. For example, the defining module registers its own class-path row before the hook runs. This can share a mechanism with `class-paths-resolve-for-entry-less-deep-imports`.
- [ ] The seat becomes a plain `ActionController.Parameters = Parameters` assignment.
- [ ] Both psych backwards-compatibility tests in `controller/parameters/serialization.test.ts` pass.
