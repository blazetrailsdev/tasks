---
title: "Port the ApplicationRecord generator"
status: draft
updated: 2026-11-03
rfc: "0212-trailties-port"
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

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/application_record/application_record_generator.rb` has no trailties port (no `generators/rails/application-record/`). `namespaced-generators.test.ts`'s `NamespacedApplicationRecordGeneratorTest` ("adds namespace to application record", `namespaced_generators_test.rb:411-418`) is parked on it. The converged shape is a `rails/application-record` generator at that path that hooks the ORM's application record generator.

## Acceptance criteria

- The generator is ported at the Rails path, and the parked test runs, with the namespace path from `generators-honor-namespace-in-output-paths`.
