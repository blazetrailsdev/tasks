---
title: "Port DiskController and DirectUploadsController"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-controllers
packages: ["activestorage"]
deps: ["activestorage-routes-and-controller-concerns"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/controllers/active_storage/disk_controller.rb` (57): `show` serves a
verified key from the named disk service (`:12-20`), `update` accepts a direct
upload with token, content-type and length checks (`:22-36`, `:54-56`),
`named_disk_service`, `decode_verified_key` / `decode_verified_token`
(`:38-52`). `direct_uploads_controller.rb` (23): `create`, `blob_args`,
`direct_upload_json`. Tests: `test/controllers/disk_controller_test.rb` (14),
`direct_uploads_controller_test.rb` (5; its cloud-service cases are out of
scope).

## Acceptance criteria

- Both controllers are ported over `DiskService`; `update` raises / answers
  Rails' `IntegrityError` → 422 and invalid-token → 404 arms.
- `disk_controller_test.rb` passes; `direct_uploads_controller_test.rb`'s
  S3/GCS/Azure cases are `PERMANENT-SKIP`s citing the RFC's non-goals, the
  rest pass.
- The two actionview direct-upload tests blocked by
  `actionview-tests-needing-actionpack-controller-and-parameters` can use these
  routes; unblocking them is that story's, not this one's.
