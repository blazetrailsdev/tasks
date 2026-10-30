---
title: "activestorage-attached-read-loads-blob"
status: draft
updated: 2026-10-30
rfc: "0209-activestorage-port"
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

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/attachment.rb:33-34` delegates to `blob`, which loads it in-line. `packages/activestorage/src/attachment.ts` delegates through a synchronous `delegateMissingTo` trap, so an unloaded `blob` is a Promise: `attachment.signedId()` and forwarded names raise `NoMethodError` until `await attachment.blob`. An invented default scope `includes("blob")` was rejected on trails#9494 by owner decision, since Rails has none.

## Acceptance criteria

- When `Attached::One` / `Attached::Many` are ported, an attachment read through them has `blob` loaded, with no default scope on `Attachment`.
- `attachment.signedId()` works on an attachment read that way.
