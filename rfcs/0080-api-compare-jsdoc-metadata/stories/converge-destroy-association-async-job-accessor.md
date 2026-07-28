---
title: "Make destroyAssociationAsyncJob's accessor reachable and give it Rails' default"
status: ready
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
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

Found in review of PR #5503 (converge-ar-model-resolution-onto-constantize).

`Core.destroyAssociationAsyncJob` (`packages/activerecord/src/core.ts:426`)
now mirrors `core.rb:27-34`: it resolves a job configured as a class _name_
through `constantize` on read. That branch is currently **unreachable from AR's
own callers**, because both read the static as a value rather than calling it:

- `associations/association.ts:983` —
  `const jobClass = (this.owner.constructor as any).destroyAssociationAsyncJob;`
  `base.ts:5034` assigns the accessor _function_ to the static, so this is
  always truthy and is pushed into `_afterCommitJobs` as the function itself.
- `associations/builder/association.ts:271` —
  `!(model._destroyAssociationAsyncJob ?? model.destroyAssociationAsyncJob)`
  — same: the second operand is the function, so the
  "A valid destroyAssociationAsyncJob is required to use `dependent: destroyAsync`"
  guard can never fire.

Relatedly, trails has no default job. Rails declares
`class_attribute :_destroy_association_async_job, default: "ActiveRecord::DestroyAssociationAsyncJob"`
(`core.rb:24`); trails leaves it unset, so the accessor's observed value is
`null`.

These interact: making the two call sites _invoke_ the accessor without first
supplying the Rails default would flip the `dependent: destroyAsync` validity
guard from never-firing to always-firing. Both halves have to land together.

## Acceptance criteria

- `_destroyAssociationAsyncJob` defaults to
  `"ActiveRecord::DestroyAssociationAsyncJob"` as in `core.rb:24`, and a
  `DestroyAssociationAsyncJob` constant exists to resolve it (or the default is
  deliberately omitted with the reason recorded at the declaration).
- `associations/association.ts:983` and
  `associations/builder/association.ts:271` call the accessor instead of
  reading the function object.
- The `dependent: destroyAsync` validity guard fires on a genuinely missing
  job and not otherwise; covered by a test that fails on baseline.
- `destroyAssociationAsyncJob`'s string-resolution branch is exercised by a
  test (assign a name, read the class back).
