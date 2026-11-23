---
title: "Port gcs_public_service_test.rb"
status: in-progress
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-gcs-service-test]
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10648
claim: "2026-11-23T16:22:17Z"
assignee: "activestorage-gcs-controller-tests"
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/service/gcs_public_service_test.rb`: `public URL generation`, `direct upload`.
fake-gcs serves every object anonymously, and `direct upload` here signs v2.

## Acceptance criteria

- [ ] The `gcs_public_service_test.rb` row leaves `unported-files/activestorage.ts`
- [ ] `public URL generation` asserts the `storage.googleapis.com` shape offline and
      a 200 on the emulator
- [ ] `direct upload` follows decision 6
