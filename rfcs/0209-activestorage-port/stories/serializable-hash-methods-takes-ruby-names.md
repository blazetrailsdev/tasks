---
title: "serializable_hash methods: takes Ruby method names (signed_id)"
status: claimed
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-03T14:11:44Z"
assignee: "extract-ruby-api-records-class-new-constants"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveStorage::DirectUploadsController#direct_upload_json` is
`blob.as_json(root: false, methods: :signed_id)`
(`vendor/rails/v8.0.2/activestorage/app/controllers/active_storage/direct_uploads_controller.rb:18`).
That emits a `signed_id` key, the key the `@rails/activestorage` client reads.

In trails, `serializableHash`'s `methods:` loop is
`hashAset(result, method, rbFSend(this, method))`
(`packages/activemodel/src/serialization.ts:58-59`), so the option has to name
the TS method (`signedId`), and the hash is keyed by that name.
`methods: "signed_id"` raises `NoMethodError`, so trails#9661 had to spell the
key by hand in `packages/activestorage/src/direct-uploads-controller.ts`
(`directUploadJson`): `{ ...blob.asJson({ root: false }), signed_id: blob.signedId() }`.
That method carries `@missingRailsArgs as_json — PERMANENT` and
`@inventedArm signedId — PERMANENT` receipts.

## Acceptance criteria

- `methods:` takes the Ruby name, keys the output by it, and calls the TS
  method it maps to under docs/ruby-ts-conventions.md. The mapping is done
  explicitly in serialization, not by widening `rbFSend`'s name guessing.
- `directUploadJson` is `blob.asJson({ root: false, methods: "signed_id" })`,
  and both receipts are deleted.
- Existing `methods:` callers are migrated.
