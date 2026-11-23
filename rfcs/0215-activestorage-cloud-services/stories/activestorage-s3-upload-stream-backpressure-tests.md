---
title: "activestorage-s3-upload-stream-backpressure-tests"
status: ready
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`S3Service#compose` / `#uploadWithMultipart` (`packages/activestorage/lib/service/s3-service.ts`, trails#10625) write into lib-storage `Upload` through a web `TransformStream`, awaiting each `writer.write` (Rails `IO.copy_stream` into `upload_stream`, `vendor/rails/v8.0.5.2/activestorage/lib/active_storage/service/s3_service.rb:100-116,139-153`). Two AC of `activestorage-s3-service-multipart-and-compose` shipped untested: that a write waits for drain (compose stays bounded in memory) and that an `Upload` failure (rejected `done()`) aborts the writer so the block cannot hang on backpressure.

## Acceptance criteria

- [ ] A test composes sources larger than several part sizes and asserts the writer never holds more than a bounded number of chunks
- [ ] A test fails a part upload (e.g. a client middleware raising on `UploadPart`) and asserts `compose` rejects promptly and no multipart upload remains (`ListMultipartUploads`)
