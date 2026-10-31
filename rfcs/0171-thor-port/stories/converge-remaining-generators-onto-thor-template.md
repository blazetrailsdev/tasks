---
title: "converge-remaining-generators-onto-thor-template"
status: done
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9514
claim: "2026-10-30T23:17:03Z"
assignee: "converge-remaining-generators-onto-thor-template"
blocked-by: null
closed-reason: null
---

## Context

`converge-generators-onto-thor-template` was marked done with trails#9410, which shipped only the
task generator and said the remaining families would follow. This story carries that remainder.

The generators below still build file bodies inline in TS and hand them to Thor's `createFile`
(`packages/thor/src/actions/create-file.ts`), where Rails calls `template` over a source file
under the generator's `templates/`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/task/task_generator.rb:8-10` is the
shape, and `packages/trailties/src/generators/rails/task/task-generator.ts` the converged port):

- `rails/benchmark`, `rails/controller`, `rails/devcontainer`, `rails/helper`, `rails/job`,
  `rails/scaffold-controller`, `rails/script`
- `test-unit/channel`, `test-unit/controller`, `test-unit/job`, `test-unit/model`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_unit/model/model_generator.rb:15-25`)
- `tse/controller`

The `template` methods in `app-generator.ts`, `rails/db/system/change/change-generator.ts` and
both `authentication-generator.ts` files are in-memory overrides of Thor's `template`
(`packages/thor/src/actions/file-manipulation.ts:109`). Rails' `edit_database_config` is
`template(database.template, "config/database.yml")` (`change_generator.rb:36-38`).

## Acceptance criteria

Re-scoped on trails#9514: devcontainer, scaffold-controller and the in-memory `template` overrides moved to `converge-generators-remainder-onto-thor-template`.

- [ ] benchmark, controller, helper, job, script, test-unit/{channel,controller,job,model} and tse/controller call Thor's `template` over a source file in their `templates/` directory, and their receipts are removed.
