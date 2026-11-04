---
title: "attachment-variant-sync-for-loaded-blob"
status: in-progress
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9689
claim: "2026-11-03T23:18:12Z"
assignee: "attachment-variant-sync-for-loaded-blob"
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Attachment#variant` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/attachment.rb:96-98`)
is `blob.variant(transformations_by_name(transformations))`, and `transformations_by_name`
(`:162-173`) only does a lookup for a Symbol. In trails `Attachment#variant`
(`packages/activestorage/src/attachment.ts:85-88`) is async for every argument: it awaits
`transformationsByName` (which awaits `namedVariants()`) and `this.blob`.

That blocks `preview-presentation-reads-without-prior-processed`: `Preview#filename` /
`#contentType` must stay sync (`blob/servable.ts` reads `contentType` synchronously), so
`Preview#presentation` (`preview.rb:127-129`) needs a sync `variant` once the preview image and
its blob are loaded.

## Acceptance criteria

- `Attachment#variant` answers synchronously for a non-name argument once `blob` is loaded
  (Attachment's `blob` reader is already sync once loaded, see `signedId` at `attachment.ts:80`).
- Callers keep working.
