---
title: "destroy-association-async-job-composite-key-where"
status: draft
updated: 2026-10-29
rfc: "0116-activejob-dependent-activerecord-work"
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

`ActiveRecord::DestroyAssociationAsyncJob#perform`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/destroy_association_async_job.rb:29`) is
`association_model.where(association_primary_key_column => association_ids).find_each`. For a
composite key, `BelongsToAssociation#handle_dependency` passes an Array column
(`associations/belongs_to_association.rb`, the `foreign_key.is_a?(Array)` arm). Rails' `where`
takes an Array key with tuple values.

trails (`packages/activerecord/src/destroy-association-async-job.ts`, trails#9432) writes
`{ [associationPrimaryKeyColumn as string]: associationIds }`. An Array column is stringified to
`"a,b"`, so a composite-key `destroyAsync` builds the wrong predicate.

## Converged shape

Pass the column through as Rails does: the tuple form of `where` that trails already uses for
composite `where([:a, :b] => [[1, 2]])`, with no string cast.

## Acceptance criteria

- `perform` passes an Array `associationPrimaryKeyColumn` to `where` without stringifying it.
- A test destroys composite-key children through the job; the `cpk_*` models in the canonical schema cover this.
