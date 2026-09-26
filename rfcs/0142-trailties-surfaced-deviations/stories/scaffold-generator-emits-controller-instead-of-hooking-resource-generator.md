---
title: "scaffold-generator-emits-controller-instead-of-hooking-resource-generator"
status: draft
updated: 2026-09-26
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

Surfaced in trails#8150 (which put both scaffold generators on `NamedBase` + `ResourceHelpers`).

Two structural deviations remain next to that work:

- `ScaffoldGenerator` (`packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts`) extends `NamedBase` and emits the model, controller, views and route itself. Rails' `ScaffoldGenerator < ResourceGenerator < ModelGenerator` (`railties/lib/rails/generators/rails/scaffold/scaffold_generator.rb:7`, `resource/resource_generator.rb:8`) delegates through `hook_for :scaffold_controller` and `hook_for :resource_route`. The scaffold controller is emitted twice, once by each generator, and the two outputs differ: only `ScaffoldControllerGenerator` emits `*Params`.
- `ScaffoldControllerGenerator`'s constructor strips a trailing `_controller` / `-controller` from the name (`name.replace(/[_-]?controller$/i, "")`). Rails' `scaffold_controller_generator.rb` has no such strip; only `ControllerGenerator` handles a suffix. The trails tests "check class collision" and "strips dashed controller suffix" assert the invented behaviour. The first of these is a Rails test name whose Rails body asserts the class-collision message (`scaffold_controller_generator_test.rb`).

## Acceptance criteria

- `ScaffoldGenerator` extends `ResourceGenerator` and invokes the scaffold_controller and resource_route generators, as Rails' hooks do, instead of emitting their files itself.
- The controller-suffix strip is removed. "check class collision" ports the Rails body.
- The existing scaffold tests stay green, or are converged to their Rails bodies.
