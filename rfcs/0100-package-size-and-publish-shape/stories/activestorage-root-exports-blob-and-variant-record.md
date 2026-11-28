---
title: "activestorage-root-exports-blob-and-variant-record"
status: ready
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
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

Found installing trailmap from `@blazetrails/*@0.1.0-alpha0.2` (trailmap-installs-published-packages-from-npm).
`packages/activestorage/lib/index.ts` exports `Attachment` from
`./app/models/active-storage/attachment.js` but not `Blob` or `VariantRecord`,
so a consumer that needs `ActiveStorage::Blob`
(`vendor/rails/v8.0.5.2/activestorage/app/models/active_storage/blob.rb`) must deep-import
`@blazetrails/activestorage/app/models/active-storage/blob`. The old flat subpaths
(`@blazetrails/activestorage/blob`, `/attachment`, `/variant-record`) no longer resolve
since the models moved under `app/models/`.

## Acceptance criteria

- `@blazetrails/activestorage`'s root export carries `Blob` and `VariantRecord` alongside `Attachment`.
- trailmap's `lib/model-schemas.ts` / `lib/attached-model-schemas.ts` import all three from the package root.
