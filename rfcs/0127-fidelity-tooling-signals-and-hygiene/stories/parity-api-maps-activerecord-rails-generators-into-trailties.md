---
title: "parity:api maps activerecord/lib/rails/generators onto trailties/src/generators"
status: draft
updated: 2026-09-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailties' Ruby side for `parity:api` is `libPath: "railties/lib/rails"` (`vendor/sources.ts:146-148`). Rails ships part of the generator tree in the activerecord gem instead:

- `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record.rb`: `ActiveRecord::Generators::Base`.
- `.../active_record/model/model_generator.rb`
- `.../active_record/migration/migration_generator.rb`
- `.../active_record/migration.rb`
- `.../active_record/application_record/application_record_generator.rb`
- `.../active_record/multi_db/multi_db_generator.rb`

trails ports these under `packages/trailties/src/generators/active-record/**`, and after trails#8270 `generators/active-record/model/model-generator.ts` is the `active_record:model` generator. `parity:api:extra --package trailties` scores it as "[no Rails counterpart]" (3 novel, 2 moved). As a result:

- no call, argument, arity or param gate compares its bodies;
- a `@missingRailsCall` / `@noRailsEquivalent` receipt there would read as a stale tag.

So its known gaps (`template "model.rb"`, `migration_template`, `generate_abstract_class`, the protected `createMigrationGenerator`) could only be tracked as stories during trails#8270's review, not as receipts.

## Acceptance criteria

- The api-compare Ruby extraction for trailties also covers `activerecord/lib/rails/generators/**`, mapped onto `trailties/src/generators/**`. That is either a second source root for the `trailties` package or `RUBY_FILE_TS_OVERRIDES` rows in `scripts/parity/conventions.ts`.
- `generators/active-record/model/model-generator.ts` pairs with `active_record/model/model_generator.rb`, and `generators/active-record/migration.ts` with `active_record/migration.rb`.
- Any new call-gate rows surfaced are converged or receipted at the call site, never baselined as new rows.
