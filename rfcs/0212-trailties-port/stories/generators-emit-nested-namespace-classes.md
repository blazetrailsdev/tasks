---
title: "Generators emit namespaced classes instead of flattened names"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/generators/scaffold_generator_test.rb:222-235` expects `class Admin::Role`, `module Admin` and `class Admin::RolesController`. trails generators flatten these to `AdminRole` and `AdminRolesController` (`packages/trailties/src/generators/rails/controller/templates/controller.ts.tt`, `active-record/model/model-generator.ts`), with `Admin` emitted as a plain object.

## Acceptance criteria

- Namespaced generators emit a class nested under its namespace, in the converged shape a Rails dev reads as `Admin::Role`, and `scaffold with namespace on invoke` asserts it.
