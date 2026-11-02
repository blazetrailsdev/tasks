---
title: "Port gcs_public_service_test.rb"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-gcs-service-test]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/service/gcs_public_service_test.rb`: `public URL generation`, `direct upload`.
fake-gcs serves every object anonymously, and `direct upload` here signs v2.

## Acceptance criteria

- [ ] `public URL generation` asserts the `storage.googleapis.com` shape offline and
      a 200 on the emulator
- [ ] `direct upload` follows the ruling on open question 1
