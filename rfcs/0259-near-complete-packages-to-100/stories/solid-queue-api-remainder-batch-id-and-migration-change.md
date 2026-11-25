---
title: "solid-queue-api-remainder-batch-id-and-migration-change"
status: draft
updated: 2026-11-25
rfc: "0259-near-complete-packages-to-100"
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

Split from `activestorage-solid-queue-api-remainder` (trails#10760). That PR brought activestorage to 700/700 and added scoped skips for `ensure_fiber_workers_have_required_dependency` and Interruptible's `self_pipe` / `create_self_pipe`. `pnpm parity:api --missing --package solid-queue` still lists three members (`vendor/solid_queue/v1.7.2/lib/`):

- `active_job/batch_id.rb` `initialize`: `super`, then `self.batch_id = SolidQueue::Batch.current_batch_id if solid_queue_job?`. BatchId is included into `ActiveJob::Base` from a load hook, so per root CLAUDE.md § "A module installed at run time is inlined behind a guard" the body goes into the ActiveJob::Base constructor behind `isModuleIncluded(new.target, …BatchId)`.
- `configuration.rb` `Process` struct's `attributes=` (declaration-only).
- `generators/solid_queue/update/templates/db/add_batches_to_solid_queue.rb` `change`. Depends on `solid-queue-update-generator-migration-templates-are-plain-ts`: a plain `.ts` template is not precompiled by `trails-tsc build-templates` (it only collects `*.tt`), so `migrationTemplate` raises `LoadError`.

## Acceptance criteria

- [ ] Each member is ported at its Rails name or has a reasoned `SCOPED_SKIP_GROUPS` entry.
- [ ] `methodsMissing` is 0 for solid-queue.
