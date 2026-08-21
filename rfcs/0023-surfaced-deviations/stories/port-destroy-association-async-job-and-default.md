---
title: "Port DestroyAssociationAsyncJob and restore Rails' _destroy_association_async_job default"
status: closed
updated: 2026-08-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Superseded by story port-destroy-association-async-job in the ActiveJob-dependent ActiveRecord work RFC (tasks PR #75), which absorbs this story''s detail verbatim: the core.rb:24 default of "ActiveRecord::DestroyAssociationAsyncJob", DestroyAssociationAsyncError, the unported-files pin (now at scripts/parity/unported-files/unscoped.ts:153, not the scripts/api-compare/unported-files.ts:147 this story cites — the file moved), and the deferred autoload test case from #5711.'
---

## Context

Surfaced by PR #5711 (converge-destroy-association-async-job-accessor).

Rails declares `class_attribute :_destroy_association_async_job, default:
"ActiveRecord::DestroyAssociationAsyncJob"` (`core.rb:24`). trails leaves the
default `null` (`packages/activerecord/src/base.ts`, `_destroyAssociationAsyncJob`)
because `activerecord/lib/active_record/destroy_association_async_job.rb` — an
`ActiveJob::Base` subclass — is unported and listed in
`scripts/api-compare/unported-files.ts:147`. Adopting Rails' default today would
make every `destroyAssociationAsyncJob()` read raise
`NameError: uninitialized constant ActiveRecord::DestroyAssociationAsyncJob`.

Consequence after #5711: `Builder::Association.checkDependentOptions`
(`associations/builder/association.ts`) now correctly fires the
`ConfigurationError` guard, so `dependent: "destroyAsync"` is unusable at
runtime on any model that has not assigned a job itself. The
`AssociationOptions.dependent` union accepts `"destroyAsync"`
(`associations.ts`) but no association can actually use it.

Blocked on a trails `activejob` package (or a minimal job-enqueue seam).

## Acceptance criteria

- `destroy_association_async_job.rb` is ported: `DestroyAssociationAsyncJob`
  (`perform`, `owner_destroyed?`) and `DestroyAssociationAsyncError`, registered
  as constants so `constantize` resolves them.
- `_destroyAssociationAsyncJob` defaults to
  `"ActiveRecord::DestroyAssociationAsyncJob"`, matching `core.rb:24`; drop the
  omitted-default note in `base.ts` and the `unported-files.ts` entry.
- Port the remaining case of
  `vendor/rails/activerecord/test/activejob/destroy_association_async_job_test.rb`
  deferred by #5711: "destroy_association_async_job error shows a missing parent
  job class, as if ActiveJob were missing" (needs Ruby `autoload` semantics via
  `activejob/unloadable_base_job.rb`).
- Port `test/activejob/destroy_association_async_test.rb` coverage for
  `dependent: :destroy_async` end to end.
