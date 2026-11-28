---
title: "trailmap imports Attachment, Blob, VariantRecord from @blazetrails/activestorage root"
status: draft
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: ["activestorage-root-exports-blob-and-variant-record"]
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10863 made `@blazetrails/activestorage`'s root export carry `Blob` and
`VariantRecord` (value exports) beside `Attachment`
(`packages/activestorage/lib/index.ts`; Rails constants at
`vendor/rails/v8.0.5.2/activestorage/app/models/active_storage/{blob,variant_record}.rb`).
trailmap still imports the dead flat subpaths:

- `trailmap/lib/attached-model-schemas.ts:1-2` — `@blazetrails/activestorage/attachment`, `/blob`
- `trailmap/lib/model-schemas.ts:29-31` — `/attachment`, `/blob`, `/variant-record`

These can only switch once a `@blazetrails/*` prerelease carrying trails#10863 is published.

## Acceptance criteria

- After a publish containing trails#10863, trailmap bumps `@blazetrails/activestorage` and imports `Attachment`, `Blob`, `VariantRecord` from the package root in both files.
