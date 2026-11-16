---
title: "Test has_many :through delete_records' no-primary-key destroy arm awaits callbacks before delete_all"
status: draft
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10160 converged `HasManyThroughAssociation#deleteRecords`' `:destroy` arm without a primary key onto
`await scope.each((r) => r._runDestroyCallbacks())`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:152`), and made
`Relation#each` (`packages/activerecord/lib/relation/delegation.ts`) await a thenable block. The ordering is
covered only by a `Relation#each` test in `test/cases/relation/delegation.trails.test.ts`. No test reaches the
`primaryKey == null` arm of `deleteRecords` itself.

## Acceptance criteria

- [ ] A test on a `has_many :through` whose through model has no primary key (canonical schema only;
      check `vendor/rails/v8.0.2/activerecord/test/schema/schema.rb` for an `id: false` join table with a
      through model) shows every through record's destroy callbacks finish before `delete_all` runs.
- [ ] The test fails if `deleteRecords` goes back to an unawaited loop.
