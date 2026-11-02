---
title: "port-model-generator-remaining-skips"
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

`packages/trailties/src/generators/model-generator.test.ts` is on `TestCase`, but these tests of `vendor/rails/v8.0.2/railties/test/generators/model_generator_test.rb` remain `it.skip`:

- help shows invoked generators options
- migration source paths
- model with database option
- model with parent and database option
- model with no migration and database option
- model with parent option database option and no migration option
- model with underscored database option
- impossible inflection rules raises an error
- migration with nested namespace without pluralization
- migration with namespaces in model name without pluralization
- migration without pluralization
- migration without timestamps
- migration with configured path
- check class collision
- database puts migrations in configured folder
- database puts migrations in configured folder with aliases

The database tests need `with_database_configuration` (`vendor/rails/v8.0.2/railties/test/generators/generators_test_helper.rb`). The help test needs `hook_for` options in `--help` output: today no "ActiveRecord options:" group prints.

## Acceptance criteria

- Each listed test runs its Rails body, or is parked under a `PERMANENT-SKIP:` line citing a ratified section.
