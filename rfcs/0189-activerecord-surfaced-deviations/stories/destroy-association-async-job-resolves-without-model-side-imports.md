---
title: "DestroyAssociationAsyncJob resolves by autoload seat, not per-model side-effect imports"
status: draft
updated: 2026-10-29
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails autoloads `ActiveRecord::DestroyAssociationAsyncJob` (`vendor/rails/v8.0.2/activerecord/lib/active_record.rb:49`, `autoload :DestroyAssociationAsyncJob`). `Builder::Association.check_dependent_options` resolves it when a `dependent: :destroy_async` association is defined, through `Core.destroy_association_async_job` (`core.rb:24-35`, which constantizes the `"ActiveRecord::DestroyAssociationAsyncJob"` default).

trails#9447 switched the canonical test models to `dependent: "destroyAsync"`. trails' `destroyAssociationAsyncJob` reader (`packages/activerecord/src/core.ts:503-515`) constantizes the default name, and nothing loads `packages/activerecord/src/destroy-association-async-job.ts`. So each of the 9 model files imports the job module itself as a stand-in for the autoload: `test-helpers/models/{book-destroy-async,essay-destroy-async,destroy-async-parent,destroy-async-parent-soft-delete,dl-keyed-belongs-to,dl-keyed-belongs-to-soft-delete,cpk}.ts` and `sharded/{blog-post,comment}-destroy-async.ts`. An application model declaring `destroyAsync` hits the same `NameError` unless something else has loaded the job.

## Converged shape

`DestroyAssociationAsyncJob` is seated on the `ActiveRecord` namespace like the other `active_record.rb` autoloads (`packages/activerecord/src/namespaces.ts`), so the default resolves with no per-model import. `activejob` is an optional peer, so this needs an awaited load step or a seat filled when activejob is present. The 9 side-effect imports are then deleted.

## Acceptance criteria

- A model declaring `dependent: "destroyAsync"` resolves the default job with no import of `destroy-association-async-job.ts` in its own file.
- The 9 side-effect imports added in trails#9447 are removed.
- `destroy-association-async.test.ts` and `core.trails.test.ts` stay green, and `pnpm parity:fixtures` still matches 146/146.
