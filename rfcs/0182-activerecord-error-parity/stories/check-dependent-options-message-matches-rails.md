---
title: "activerecord: Builder::Association.check_dependent_options raises Rails' message"
status: draft
updated: 2026-10-02
rfc: "0182-activerecord-error-parity"
cluster: errors
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Builder::Association.check_dependent_options`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:130-134`) raises

    "A valid destroy_association_async_job is required to use `dependent: :destroy_async` on associations"

`packages/activerecord/src/associations/builder/association.ts:218-222` raises

    "A valid destroyAssociationAsyncJob is required to use `dependent: destroyAsync` on associations"

The method name is camelCased and the option value has lost its Symbol colon. The three ported tests in
`packages/activerecord/src/destroy-association-async-job.test.ts` assert `/destroyAssociationAsyncJob/`,
where Rails' tests (`vendor/rails/v8.0.2/activerecord/test/activejob/destroy_association_async_job_test.rb`)
assert `/destroy_association_async_job/`. Seen while porting `destroy_association_async_job`'s accessors
in trails#8384; left alone there because the line's condition, not its message, was in scope.

## Acceptance criteria

- [ ] The message is Rails' string, with the option rendered the way other trails messages render a Symbol option value (compare the `Unknown key: :trough. Valid keys are: :className, …` message in `has-many-associations.test.ts`).
- [ ] The three tests assert what the Rails tests assert against the converged message.
