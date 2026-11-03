---
title: "Generator namespace and help banner match Rails"
status: draft
updated: 2026-11-03
rfc: "0212-trailties-port"
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

`ResourceGenerator --help` prints `bin/trails generate generators:resource_generator NAME ...`, and `ResourceGenerator.namespace()` answers `rails:generators:resource_generator` in `packages/trailties/src/generators/rails/resource/resource-generator.test.ts`'s setup. The class's name is set by `Object.defineProperty(ResourceGenerator, "name", ...)` to `Rails::Generators::ResourceGenerator`. Rails derives `resource` from `Rails::Generators::Base.namespace` / `banner` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb`), giving `bin/rails generate resource NAME ...`.

## Acceptance criteria

- `ResourceGenerator.namespace()` answers what Rails' does, and the `--help` banner reads `bin/trails generate resource NAME [field[:type][:index] field[:type][:index]] [options]`.
