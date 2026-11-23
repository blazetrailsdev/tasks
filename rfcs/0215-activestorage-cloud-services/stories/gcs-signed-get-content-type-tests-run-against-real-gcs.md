---
title: "GCS content-type signed-GET tests run un-skipped against an endpoint that answers the stored type"
status: draft
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
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

`packages/activestorage/test/service/gcs-service.test.ts` "upload with content_type and content_disposition", "upload with content_type" and "update custom_metadata" GET a signed `service.url(..., contentType: "text/html")` and assert the stored `text/plain`, as Rails does (`vendor/rails/v8.0.5.2/activestorage/test/service/gcs_service_test.rb`). `GCSService#private_url` puts `response-content-type` into the signed URL's query (`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/service/gcs_service.rb:137-151`); real GCS answers the stored metadata type, but fake-gcs-server 1.56.1 (CI, `.github/workflows/ci.yml:1850-1852`) applies the override and answers `text/html`. Until trails#10673 these tests passed only on a text/plain 404; that PR made the GETs reach the object and parked the three tests.

## Acceptance criteria

- [ ] The three tests run un-skipped in CI and pass against an endpoint that answers the stored content type (real GCS, or a fake-gcs-server release / config that ignores `response-content-type` on a signed GET)
- [ ] Their assertions stay as Rails' (`assert_equal "text/plain", response.content_type`)
