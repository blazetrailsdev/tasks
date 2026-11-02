---
title: "port-remaining-generator-tests-onto-test-case"
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

`port-small-generator-test-files-onto-test-case` moved helper, job, generator_generator, task, script and benchmark onto `TestCase`. Left over from `vendor/rails/v8.0.2/railties/test/generators`:

- `db_system_change_generator_test.rb`: the generator exists; `packages/trailties/src/generators/rails/db/system/change/change-generator.test.ts` (300 lines) still uses `node:fs` helpers.
- `benchmark_generator_test.rb:75-83` ("generate benchmark twice only adds ips gem once") and the Gemfile assertion at `:18`: the generator adds no dependency.
- No generator ported yet, so port generator and test together: `mailer` (14 tests), `integration_test`, `system_test`, `application_record`, `multi_db`, `action_text_install`, `action_mailbox_install`.
- A `::` parent in `rails/controller/templates/controller.ts.tt` and `rails/job/templates/job.ts.tt` imports a flattened name the parent's file does not export; `active-record/model/model-generator.ts#createModelFile` shows the alias shape.

## Acceptance criteria

- Each file named above is ported onto `TestCase` with test names verbatim, and its generator emits the namespaced leaf class per `packages/trailties/CLAUDE.md` § "The application loader is Zeitwerk".
- A `::` parent generates a file that imports what the parent file exports.
