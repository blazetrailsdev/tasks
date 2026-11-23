---
title: "activestorage-cloud-ci-enable-endpoints"
status: done
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10625
claim: "2026-11-23T02:14:04Z"
assignee: "activestorage-cloud-ci-enable-endpoints"
blocked-by: null
closed-reason: null
---

## Context

`activestorage-cloud-tests` in `.github/workflows/ci.yml` (trails#10602) starts SeaweedFS and fake-gcs-server and creates the buckets, but leaves `ACTIVE_STORAGE_S3_ENDPOINT` and `ACTIVE_STORAGE_GCS_ENDPOINT` unset. Setting them adds `s3`/`gcs` to `SERVICE_CONFIGURATIONS` (`packages/activestorage/test/support/test-helper.ts`), which ungates the controller tests. Those then raise `Missing service adapter for "S3"` until `s3-service.ts` and `gcs-service.ts` exist (`configurator.rb:29-34`).

## Acceptance criteria

- [ ] Once `S3Service` lands, the job's vitest step sets `ACTIVE_STORAGE_S3_ENDPOINT: http://localhost:8333`
- [ ] Once `GCSService` lands, it sets `ACTIVE_STORAGE_GCS_ENDPOINT: http://localhost:4443`
- [ ] The lane runs the s3/gcs service and controller tests green
