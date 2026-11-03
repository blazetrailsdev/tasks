---
title: "Add the --database option to the model and migration generators"
status: in-progress
updated: 2026-11-03
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9644
claim: "2026-11-03T00:16:39Z"
assignee: "manifest-and-rails-namespace-seats"
blocked-by: null
closed-reason: null
---

## Context

Rails `test_scaffold_generator_multi_db_abstract_class` and `test_scaffold_generator_database_with_aliases` (`vendor/rails/v8.0.2/railties/test/generators/scaffold_generator_test.rb:504-523`) use `--database` / `--db`, which the trails generators do not declare, so both are `it.skip` in `packages/trailties/src/generators/rails/scaffold/scaffold-generator.test.ts`.

Sizing comes from the pilot `trailties-port-generator-tests-onto-generators-test-case`: about 9 LOC per Rails test on `controller_generator_test.rb`, about 33 on `scaffold_generator_test.rb`.

## Acceptance criteria

- Both tests run, with `withDatabaseConfiguration` ported from `generators_test_helper.rb:47-63`.
