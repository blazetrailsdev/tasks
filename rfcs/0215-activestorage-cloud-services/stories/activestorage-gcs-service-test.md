---
title: "Port gcs_service_test.rb"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps:
  [
    activestorage-gcs-service-urls,
    activestorage-cloud-test-configurations,
    activestorage-cloud-ci-emulators,
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/service/gcs_service_test.rb`: `name`, `direct upload`, `direct upload with
content disposition`, `direct upload with cache control`, `upload with content_type
and content_disposition`, `upload with content_type`, `upload with cache_control`,
`upload with custom_metadata`, `update custom_metadata`, `signed URL generation`,
and behind `gsa_email` (:169) `direct upload with IAM signing` and `url with IAM
signing`. fake-gcs refuses a v2 signed PUT with `400 invalid uploadType`.

## Acceptance criteria

- [ ] The `gcs_service_test.rb` row leaves `unported-files/activestorage.ts`
- [ ] Per decision 6, the v2 URL is asserted offline and the upload goes through v4;
      any parked PUT has a `PERMANENT-SKIP` naming fake-gcs
- [ ] `direct upload with cache control` runs in full, as it signs v4
- [ ] `signed URL generation` uses the offline config
- [ ] The IAM tests stay behind Rails' guard
- [ ] fake-gcs lets the query override a stored disposition, so each test asserting
      the stored value wins reads the stored metadata, and the weaker proof is
      listed in the RFC
