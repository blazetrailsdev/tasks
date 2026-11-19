---
title: "trailmap: warm Active Storage's model schemas at boot"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#174 attached Active Storage to `Base`, but `lib/model-schemas.ts` (`MODELS`) cannot list `ActiveStorage::Blob` / `Attachment` / `VariantRecord`. Importing them during boot throws `base.hasOneAttached is not a function`, which is trails story `blob-import-before-attached-model-initializer`. So a served process reaches Blob with unwarmed columns. trailmap's `test/models/active-storage.test.ts` hit `MissingAttributeError: can't write unknown attribute 'key'` until it called `loadSchema()` on Blob and Attachment by hand.

## Acceptance criteria

- [ ] Once the trails story lands and is vendored, `MODELS` in `lib/model-schemas.ts` includes Blob, Attachment and VariantRecord.
- [ ] `test/models/active-storage.test.ts` drops its hand warm-up.
