---
title: "Converge destroy_async test-helper models from dependent: destroy to destroyAsync"
status: closed
updated: 2026-08-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by story port-destroy-association-async-test-and-flip-models in the ActiveJob-dependent ActiveRecord work RFC (tasks PR #75), which owns the same six-model flip plus the Rails tests that observe it. This story's stated blocker ('depends on a default job existing') is that RFC's story port-destroy-association-async-job, so the dependency is now expressible; it was not here."
---

## Context

Surfaced by PR #5711 (converge-destroy-association-async-job-accessor), which
widened `AssociationOptions.dependent` (`packages/activerecord/src/associations.ts`)
to include `"destroyAsync"`.

Several test-helper models still declare `dependent: "destroy"` where Rails uses
`dependent: :destroy_async`, each carrying a comment saying so — the union was
the blocker and it is now gone:

- `test-helpers/models/essay-destroy-async.ts` (both `belongsTo`)
- `test-helpers/models/book-destroy-async.ts`
- `test-helpers/models/destroy-async-parent.ts`
- `test-helpers/models/destroy-async-parent-soft-delete.ts`
- `test-helpers/models/dl-keyed-belongs-to.ts`
- `test-helpers/models/dl-keyed-belongs-to-soft-delete.ts`

Rails originals: `vendor/rails/activerecord/test/models/essay_destroy_async.rb`,
`book_destroy_async.rb`, `destroy_async_parent.rb`,
`destroy_async_parent_soft_delete.rb`, `dl_keyed_belongs_to.rb`,
`dl_keyed_belongs_to_soft_delete.rb`.

Depends on a default job existing — with `_destroyAssociationAsyncJob` null,
`checkDependentOptions` raises `ConfigurationError` at class-definition time,
so flipping these models today breaks every suite that imports them.

## Acceptance criteria

- Each model above uses `dependent: "destroyAsync"` (plus `ensuringOwnerWas`
  where Rails has `ensuring_owner_was:`), matching its Rails counterpart.
- The "Using \"destroy\" until AssociationOptions.dependent includes
  \"destroyAsync\"" comments are removed.
- Suites importing these models still pass.
