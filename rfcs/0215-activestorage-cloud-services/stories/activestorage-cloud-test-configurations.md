---
title: "Gate cloud tests on SERVICE_CONFIGURATIONS as Rails does"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: [activestorage-configurator-loads-services]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails gates each file on `SERVICE_CONFIGURATIONS[:s3]`
(`vendor/rails/v8.0.2/activestorage/test/service/s3_service_test.rb:7`) read from `configurations.yml`
(`vendor/rails/v8.0.2/activestorage/test/dummy/config/environments/test.rb:40`, `vendor/rails/v8.0.2/activestorage/test/service/configurations.example.yml`).
The trails table is `SERVICE_CONFIGURATIONS` in
`packages/activestorage/src/test-helpers/test-helper.ts:146`, holding `local`
only.

## Acceptance criteria

- [ ] `s3`, `s3_public`, `gcs` and `gcs_public` entries appear when the emulator
      environment variables are set, each pointing at a public or private bucket
- [ ] Tests use a `describe.skipIf` gate that `parity:test`'s gate extractor reads
      as Rails' gate, so `gate-mismatch` stays zero
- [ ] A dummy-credential config with no `endpoint`, for offline URL assertions
- [ ] GCS uses an RSA key generated at test start, committing no key
- [ ] `SharedServiceTests` accepts an awaited `Service.configure`, since `load`
      precedes it
