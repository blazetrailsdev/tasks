---
title: "Port S3Service multipart upload, compose and delete_prefixed"
status: draft
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-s3
packages: [activestorage]
deps: [activestorage-s3-service-object-calls]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/s3_service.rb`: `delete_prefixed` :68, `compose` :100,
`upload_with_multipart` :139, with `MAXIMUM_UPLOAD_PARTS_COUNT` :130 and
`MINIMUM_UPLOAD_PART_SIZE` :131. `upload_stream` has no JS twin; the RFC's
design maps it to `Upload` over a `PassThrough`.

## Acceptance criteria

- [ ] `partSize` is `max(ceil(size / 10000), 5 MB)` as at :140
- [ ] A write waits for `drain`, tested by a `compose` that stays bounded in memory
- [ ] A failed stream rejects `upload` and leaves no unawaited promise; `Upload`
      aborts the multipart upload
- [ ] `delete_prefixed` pages past 1,000 keys, with a test crossing a page
- [ ] `compose` passes metadata and `uploadOptions` as at :104-110
- [ ] The whole shared service test suite passes on SeaweedFS
