---
title: "Port S3Service URLs and direct-upload headers"
status: draft
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-s3
packages: [activestorage]
deps: [activestorage-s3-service-object-calls]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/s3_service.rb`: `url_for_direct_upload` :82,
`headers_for_direct_upload` :94, `private_url` :119, `public_url` :125,
`custom_metadata_headers` :167.

## Acceptance criteria

- [ ] `privateUrl` signs with `expiresIn` as an integer and passes both
      `response-*` parameters
- [ ] `urlForDirectUpload` signs `content-length`, so a longer body is refused
- [ ] Custom metadata and `uploadOptions` reach the signed PUT
- [ ] `publicUrl` handles `virtualHost` without an SDK helper, with a
      `@missingRailsCall` receipt
- [ ] `headersForDirectUpload` returns Rails' four-key shape, `x-amz-meta-*` included
