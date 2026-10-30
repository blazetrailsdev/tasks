---
title: "activestorage-attachment-delegation-loads-blob"
status: done
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9494
claim: "2026-10-30T15:26:56Z"
assignee: "activestorage-attachment-delegation-loads-blob"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/attachment.rb:33-34` is `delegate_missing_to :blob` and `delegate :signed_id, to: :blob`, both of which load the blob. `packages/activestorage/src/attachment.ts` forwards through a hand-written prototype-chain Proxy, not `delegateMissingTo`, and only to a blob already loaded; `signedId` reads `association("blob").target` and raises TypeError when unloaded, because `Base#signedId` returns `string` (TS2416 on an async override). `Delegation.generateMethodMissing` wraps an instance and reads the target off the Proxy's target, so it cannot sit on a prototype.

## Acceptance criteria

- `generateMethodMissing` reads the target through the receiver, so Attachment's Proxy is built over `delegateMissingTo`.
- `attachment.signedId()` works for an unloaded blob, for example by a preload that guarantees `blob` is loaded where an attachment is read.
- "getting a signed blob ID from an attachment" (`attachment_test.rb:107`) passes.
