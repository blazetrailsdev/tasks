---
title: "test_databases_test: assign Rails' plain configuration hash instead of a spied stub"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/test-databases.test.ts` does not mirror
`vendor/rails/v8.0.2/activerecord/test/cases/test_databases_test.rb:8-56`. Rails assigns a plain
Hash (`ActiveRecord::Base.configurations = { "arunit" => { "primary" => { … } } }`), reads the
real `configs_for(env_name: "arunit", name: "primary")`, and stubs only
`DatabaseTasks.reconstruct_from_schema` with a lambda that asserts `db_config.database`.

The port builds a hand-rolled `mockConfig` with `_database` / `database` accessors, wraps it with
`stubConfigurations`, and spies `DatabaseConfigurations.prototype.configsFor` to return it, so the
real `HashConfig#_database=` and `configs_for` never run. PR 8357 moved that spy from the instance
to the prototype only to keep it alive across `configurations=`
(`activerecord/lib/active_record/core.rb:71-73`).

## Acceptance criteria

- [ ] Each test assigns Rails' plain configuration hash and reads real `HashConfig`s through `configsFor`.
- [ ] `reconstructFromSchema` is the only stub, and it asserts the database name as the Rails lambda does.
- [ ] `stubConfigurations` and the prototype spy are deleted. Test names unchanged.
