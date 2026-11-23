---
title: "GCS signed-URL GET tests reach the object instead of passing on a text/plain 404"
status: ready
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/test/service/gcs-service.test.ts` GETs `service.url(...)` against the configured `apiEndpoint` (`http://localhost:4443`). fake-gcs-server serves its XML object routes only on `-public-host` (CI: `127.0.0.1:4443`, `.github/workflows/ci.yml:1850-1852`), so these GETs return `404` with `Content-Type: text/plain; charset=utf-8`. "upload with content_type and content_disposition" and "upload with content_type" (Rails `vendor/rails/v8.0.5.2/activestorage/test/service/gcs_service_test.rb`, the `assert_equal "text/plain", response.content_type` lines) and "update custom_metadata" therefore pass only because the 404 page is text/plain, so they don't test what their names say. trails#10657 fixed "direct upload with cache control" by fetching through `127.0.0.1`.

## Acceptance criteria

- [ ] Every GET of a signed `service.url` in gcs-service.test.ts reaches the object (e.g. the `localhost` → `127.0.0.1` rewrite used in trails#10657, or `apiEndpoint` pointed at the public host in `test/support/service-configurations.ts`), and asserts the response header as Rails does
- [ ] Each converted test is verified to fail when the object is missing
