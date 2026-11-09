---
title: "Active Storage attach never uploads: the attachment's touch saves a second record instance, and commit callbacks run on it"
status: draft
updated: 2026-11-09
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in trailmap (#131, while building trailmap-audits-to-activestorage). With
Rails 8.0 defaults (`runCommitCallbacksOnFirstSavedInstancesInTransaction = false`,
trailties `application/configuration.ts` load_defaults 7.1), `record.report.attach({ io, filename })`
on a persisted record saves the blob and attachment rows but never uploads the file.
A download then raises `ActiveStorage::FileNotFoundError`. `Model.create({ report: {...} })` has the same failure.

Cause: `Attachment`'s `belongs_to :record, touch: ActiveStorage.touchAttachmentRecords`
touches a freshly loaded `record`, not the instance being attached to. That second
instance is enrolled in the transaction last, so `prepareInstancesToRunCallbacksOn`
(activerecord `connection-adapters/abstract/transaction.ts` ~:400) runs commit
callbacks on it. Its `attachmentChanges` is empty, so `attached/model.ts:113-119`'s
`afterCommit` finds no `CreateOne` and `upload` never runs.
Confirmed: setting `config.activeStorage.touchAttachmentRecords = false` makes the upload happen.

Expected (Rails): the attachment built by the `has_one` writer has its `record`
association target set by inverse, so the touch hits the SAME instance and commit
callbacks run on the one that holds `attachment_changes`
(activestorage/app/models/active_storage/attachment.rb `belongs_to :record, polymorphic: true, touch:`).

## Acceptance criteria

- A test on `hasOneAttached` with 8.0 defaults: `attach` a Hash on a persisted record, then `blob.download()` returns the bytes.
- Same test for `create` with the attachable attribute.
- The record reached through `attachment.record` is the attaching instance (identity), as Rails' inverse gives.
