---
title: "Port the ActiveJob enqueue/perform test helpers destroy_association_async_test.rb needs"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
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

# Port the ActiveJob enqueue/perform test helpers that `destroy_association_async_test.rb` needs

## Context

`destroy-async-test-port-and-model-flip` (RFC 0106) is blocked on this: half of
its acceptance criteria is porting
`vendor/rails/activerecord/test/activejob/destroy_association_async_test.rb`
(441 lines, 20 tests), and every one of those tests asserts through
`ActiveJob::TestHelper`:

- `assert_enqueued_jobs n, only: ActiveRecord::DestroyAssociationAsyncJob`
- `perform_enqueued_jobs only: ActiveRecord::DestroyAssociationAsyncJob`
- `assert_enqueued_with(job:, args:)`
- `assert_no_enqueued_jobs [only: ...]`

trails has **no `activejob` package at all** (`packages/` holds actionpack,
actionview, activemodel, activerecord, activerecord-cli, activesupport, arel,
date, did-you-mean, globalid, html-sanitizer, i18n, nokogiri, rack, trailties,
tse-compiler, website). What exists on the ActiveRecord side is only the
configuration and the payload:

- `Base.destroyAssociationAsyncJob()` / `destroyAssociationAsyncBatchSize`
  (`packages/activerecord/src/core.ts`), validated at declaration time by
  `associations/builder/association.ts` — covered by
  `packages/activerecord/src/destroy-association-async-job.test.ts`, the port of
  `test/activejob/destroy_association_async_job_test.rb`.
- `Association#enqueueDestroyAssociation`
  (`packages/activerecord/src/associations/association.ts:1061`), which parks
  `[jobClass, options]` on the owner's `_afterCommitJobs` — the port of
  `association.rb:398-404`. Nothing dequeues or performs it.

So the assertions have nothing to observe: there is no queue adapter, no
`enqueued_jobs` store, no `perform_enqueued_jobs` drain, and
`ActiveRecord::DestroyAssociationAsyncJob`
(`vendor/rails/activerecord/lib/active_record/destroy_association_async_job.rb`)
itself is unported — it is an `ActiveJob::Base` subclass.

The `:destroy_async` dependent arm that these tests exercise lands separately in
PR #6762.

## Scope

Minimum needed to unblock the AR-side test port, in Rails' own shapes:

1. `ActiveJob::QueueAdapters::TestAdapter` (`activejob/lib/active_job/queue_adapters/test_adapter.rb`)
   — `enqueued_jobs` / `performed_jobs` stores and `perform_enqueued_jobs`.
2. `ActiveJob::TestHelper` (`activejob/lib/active_job/test_helper.rb`) — the four
   assertions above, with their `only:` / `args:` filters.
3. `ActiveRecord::DestroyAssociationAsyncJob` and the drain that turns
   `_afterCommitJobs` into real enqueues at `after_commit`.

Splitting this into its own RFC/epic is fine and probably right — file it as
whatever shape the maintainers prefer; this story exists so the blocker is
named rather than rediscovered.

## Acceptance criteria

- [ ] `assert_enqueued_jobs`, `perform_enqueued_jobs`, `assert_enqueued_with` and
      `assert_no_enqueued_jobs` exist with Rails' names and semantics.
- [ ] `ActiveRecord::DestroyAssociationAsyncJob` is ported and performing an
      enqueued job destroys the association records.
- [ ] `destroy-async-test-port-and-model-flip` can be unblocked: its test port
      has the helpers it needs.
