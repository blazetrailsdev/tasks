---
title: "Port GCSService URLs and direct-upload headers"
status: draft
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-gcs-service-object-calls]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb`: `url_for_direct_upload` :92,
`headers_for_direct_upload` :128, `private_url` :148, `public_url` :165,
`custom_metadata_headers` :228. Signing is v2 unless `cache_control` selects v4
(:95-102).

## Acceptance criteria

- [ ] v2 / v4 selection is Rails', with the header merge in Rails' order
- [ ] `expires` is converted from Rails' seconds to Node's absolute time
- [ ] `privateUrl` passes both `response-*` query parameters
- [ ] `publicUrl` uses `File#publicUrl`
- [ ] `headersForDirectUpload` is Rails' shape, adding `Cache-Control` only when set
