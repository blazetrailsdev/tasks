---
title: "Port ActiveRecord::DestroyAssociationAsyncJob and its two Rails test files"
status: draft
updated: 2026-08-21
rfc: "0000-activejob-dependent-activerecord-work"
cluster: null
packages: ["activerecord"]
deps: ["port-after-commit-jobs-callback"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/destroy_association_async_job.rb`
is **27 code lines** and has no trails counterpart. It is the job
`add_after_commit_jobs_callback` enqueues: it reloads the owner, guards on
`owner_destroyed?`, and destroys the association's records through
`find_each(&:destroy)` so each child runs its own callbacks.

trails already has the config seam it hangs off —
`Base.destroyAssociationAsyncJob` (`packages/activerecord/src/core.ts:477`,
`base.ts:4023-4025`), including the `constantize` arm for a string value — and
`associations/builder/association.ts:246` already raises Rails'
error message verbatim ("A valid destroyAssociationAsyncJob is required to use
dependent: destroyAsync on associations") when it is unset. There is nothing for that config to point at.

Two Rails test files cover the job directly:

| file                                                                | code lines | tests |
| ------------------------------------------------------------------- | ---------: | ----: |
| `activerecord/test/activejob/destroy_association_async_job_test.rb` |         49 |     5 |
| `activerecord/test/activejob/job_runtime_test.rb`                   |         29 |     2 |

`test/activejob/helper.rb` (9 lines) and `unloadable_base_job.rb` (1 line) are
the directory's support files and are ported with them.

## Acceptance criteria

- `DestroyAssociationAsyncJob` ported at the Rails path, subclassing the trails
  ActiveJob base, with Rails' names for every keyword argument
  (`owner_model_name`, `owner_id`, `association_class`, `association_ids`,
  `association_primary_key_column`, `ensuring_owner_was_method`).
- The `owner_destroyed?` guard and the `find_each(&:destroy)` shape are ported,
  not collapsed into a bulk delete — child callbacks must run.
- Both Rails test files ported under `packages/activerecord/src/`, test names
  verbatim per the never-rename rule, and enrolled so `parity:test` credits
  them (see memory: test-compare enrollment needs four registrations).
- `pnpm parity:test` delta for activerecord is **+7 or better**.
- SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/destroy-association-async-job.test.ts
pnpm parity:test
pnpm parity:api --package activerecord
```
