---
title: "Remove Blob#contentType, read by Servable"
status: draft
updated: 2026-11-02
rfc: "0209-activestorage-port"
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

`Blob::Servable` reads `content_type` on a Blob and on a Variant (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/blob/servable.rb:5,16,20`; `delegate :content_type` at `variant.rb`). In trails the Blob column stays `content_type`, the variants answer `contentType`, and `packages/activestorage/src/blob.ts` adds a `contentType` getter so `packages/activestorage/src/blob/servable.ts` has one spelling to read. Removing the getter adds 10 `blob.ts` `content_type` rows to `parity:api:calls` (trails#9606, df590108bf), because the gate credits Rails' `content_type` calls to it.

## Acceptance criteria

- `Blob#contentType` and its `@noRailsEquivalent` receipt are gone, by the call gate crediting a read of the `content_type` column, or by a repo-owner ruling on the spelling.
- `Servable` reads one Rails-named member on Blob, Variant and VariantWithRecord.
