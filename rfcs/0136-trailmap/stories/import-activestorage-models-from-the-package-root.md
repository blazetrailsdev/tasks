---
title: "Import ActiveStorage models from @blazetrails/activestorage's root, not app/models deep paths"
status: draft
updated: 2026-11-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
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

trailmap imports the ActiveStorage models from deep paths:
`lib/attached-model-schemas.ts:1-2` and `lib/model-schemas.ts:29-31` import
`@blazetrails/activestorage/app/models/active-storage/{attachment,blob,variant-record}`.
This was a stopgap until the package root exported them. The trails story
`activestorage-root-exports-blob-and-variant-record` is done, and
`@blazetrails/activestorage@0.1.0-alpha0.3`'s `dist/index.js` now exports `Blob` and `VariantRecord`.

Expected shape: `import { Attachment, Blob, VariantRecord } from "@blazetrails/activestorage";`

## Acceptance criteria

- No import under `app/`, `lib/` or `config/` reaches into `@blazetrails/activestorage/app/models/`.
- `pnpm build`, `pnpm test` and `pnpm gate` pass.
- If the root import hits the table-name memoization ordering bug
  (`activestorage-root-import-before-engine-memoizes-unprefixed-blob-table`, draft),
  stop and block on that trails story instead of working around it.
