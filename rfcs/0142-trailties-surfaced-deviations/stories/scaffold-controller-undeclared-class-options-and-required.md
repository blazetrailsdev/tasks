---
title: "ScaffoldControllerGenerator: declare :helper/:api/:skip_routes class options; enforce Thor required"
status: done
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 6
pr: trails#8248
claim: "2026-09-29T16:20:48Z"
assignee: "delete-invented-action-dispatch-respond-to-and-csrf-modules"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8217, which declared `class_option :orm` on `ScaffoldControllerGenerator`
(`railties/lib/rails/generators/rails/scaffold_controller/scaffold_controller_generator.rb:13-14`).

- Rails' other `class_option`s in the same file are not declared. `:helper` is at `:12`, `:api` at `:15-16` and
  `:skip_routes` at `:18`. They exist only as fields on the TS `ScaffoldControllerGeneratorOptions` interface, with
  destructured defaults in `run()`, so `classOptionsHelp` and `GeneratorBase.start` never see them.
- `ClassOptionConfig` (`packages/trailties/src/generators/base.ts`) gained Thor's `required` key, but nothing
  enforces it. Thor's `Thor::Options#check_requirement!` raises `Thor::RequiredArgumentMissingError`
  ("No value provided for required options '--orm'") when a required option has neither a value nor a default.

## Acceptance criteria

- `ScaffoldControllerGenerator` declares `helper`, `api` and `skipRoutes` via `classOption`, in Rails' order and
  with Rails' types and descs. The ad hoc destructured defaults in `run()` go away.
- `GeneratorBase.start` enforces `required: true` the way Thor does.
