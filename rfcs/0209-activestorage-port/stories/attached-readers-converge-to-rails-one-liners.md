---
title: "Converge Attached readers to Rails' one-liners"
status: in-progress
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9542
claim: "2026-10-31T17:30:45Z"
assignee: "rake-thread-pool-history"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Attached::One#attachment` and `Attached::Many#attachments` are one-liners (`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/one.rb:30-32`, `many.rb:27-29`), and the blob loads lazily at `delegate :signed_id, to: :blob` (`app/models/active_storage/attachment.rb:33-34`). trails#9516 loads it early because that delegation is synchronous: `packages/activestorage/src/attached/one.ts` awaits the blob in `attachment`, `many.ts` reads through `.includes("blob")` and adds `associationAttachments`, and `One#isAttached` open-codes the reader.

## Acceptance criteria

- `attachment` and `attachments` are Rails' one-liners, `isAttached` calls them, and `associationAttachments` is deleted.
- `attachment.signedId()` works on an attachment read through `One` / `Many` with no blob query beyond those Rails runs.
- The `@inventedArm` and `@noRailsEquivalent` receipts on those readers are removed.
