---
title: "port-integration-system-multidb-actiontext-generators"
status: draft
updated: 2026-11-06
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

`port-remaining-generator-tests-onto-test-case` moved `db_system_change_generator_test.rb` onto `TestCase` (mailer was already there, and the `::` parent alias in `trails/controller/templates/controller.ts.tt` / `trails/job/templates/job.ts.tt` had landed). Still left from `vendor/rails/v8.0.2/railties/test/generators`, each needing its generator ported alongside the test:

- `integration_test_generator_test.rb` (`railties/lib/rails/generators/rails/integration_test/`, `test_unit/integration/`)
- `system_test_generator_test.rb` (`rails/system_test/`, `test_unit/system/`)
- `application_record_generator_test.rb` — `packages/trailties/src/generators/trails/application-record/application-record-generator.ts` exists, no test file.
- `multi_db_generator_test.rb` (`rails/multi_db/`)
- `action_text_install_generator_test.rb` (`actiontext/lib/generators/action_text/install/`)
- `benchmark_generator_test.rb:18` Gemfile assertion and `:75-83` "generate benchmark twice only adds ips gem once": the trails benchmark generator adds no dependency (package.json analogue of `gem "benchmark-ips"`).

Fixture helpers `copyDockerfile`, `copyDevcontainerFiles`, `assertComposeFile`, `assertDevcontainerJsonFile` now live in `packages/trailties/src/generators/generators-test-helper.ts`.

## Acceptance criteria

- Each file above is ported onto `TestCase` with test names verbatim, alongside its generator, emitting the namespaced leaf class per `packages/trailties/CLAUDE.md` § "The application loader is Zeitwerk".
- Benchmark generator adds its ips dependency once, and the two benchmark assertions are ported.
