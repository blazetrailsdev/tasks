---
title: "GCS direct-upload tests upload through the v4 path instead of skipping"
status: ready
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: ["activestorage"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/test/service/gcs-service.test.ts` holds 6 of the 19 `gcs_service_test.rb` tests as `PERMANENT-SKIP` (lines 37, 64, 95, 136, 172, 348: "direct upload", "directly uploading file larger than the provided content-length does not work", "direct upload with content disposition", "direct upload with cache control", "... rejects a Content-Type the URL does not sign", "direct upload with IAM signing"), all because fake-gcs-server refuses a v2 signed PUT. `pnpm parity:test --package activestorage` reports `service/gcs_service_test.rb  13 OK  6 Skip`, the only cloud test file short of 100%.

RFC 0215 Decision 6 says to assert the v2 URL offline and **upload through the v4 path, which fake-gcs accepts**, with a `PERMANENT-SKIP` only if that fails. The shipped tests skip without trying the v4 upload.

## Acceptance criteria

- [ ] Each of the 6 tests asserts the v2 URL offline (where it doesn't already) and runs Rails' PUT plus its assertions against fake-gcs through a v4-signed URL for the same key, headers and content type
- [ ] A test keeps `PERMANENT-SKIP` only when the v4 path also fails, with the fake-gcs gap named in the reason (e.g. no `x-goog-content-length-range` enforcement)
- [ ] `pnpm parity:test --package activestorage` shows fewer Skip for `gcs_service_test.rb`, with any that remain justified
