---
title: "generators-honor-namespace-in-output-paths"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`Generators.namespace` (isolated engines) reaches generated paths only through `NamedBase#class_path` (`packages/trailties/src/generators/named-base.ts:127`, `vendor/rails/v8.0.2/railties/lib/rails/generators/named_base.rb`). The controller, helper, tse, test-unit and model generators compute their paths without it (`rails/controller/controller-paths.ts`, `tse/controller/controller-generator.ts:27`), so `app/controllers/test_app/account-controller.ts` and `app/models/test_app/account.ts` are never written; `tse/scaffold` and `test-unit` also disagree on the import path. `namespaced_generators_test.rb` is ported at `packages/trailties/src/generators/namespaced-generators.test.ts`; its controller, model and scaffold tests that assert these paths are parked as `it.skip` pointing here. The migration tests already pass.

The class-body half (`module_namespacing`, `namespace TestApp` wrapping) is `generators-emit-nested-namespace-classes`.

## Acceptance criteria

- Every generator's output path goes through `class_path` as Rails' does, and `--skip-namespace` restores the plain path.
- The parked controller, model and scaffold tests in `namespaced-generators.test.ts` run, apart from those waiting on `generators-emit-nested-namespace-classes`, `actionmailer-railtie-and-mailer-generator` or an ApplicationRecord generator.
