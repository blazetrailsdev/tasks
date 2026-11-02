---
title: "Port s3_service_test.rb"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-s3
packages: [activestorage]
deps:
  [
    activestorage-s3-service-urls,
    activestorage-s3-service-multipart-and-compose,
    activestorage-cloud-test-configurations,
    activestorage-cloud-ci-emulators,
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/service/s3_service_test.rb`: `name`, `direct upload`, `direct upload with
content disposition`, `directly uploading file larger than the provided
content-length does not work`, `upload a zero byte file`, `signed URL generation`,
`uploading with server-side encryption`, `upload with content type`, `upload with
custom_metadata`, `upload with content disposition`, `uploading a large object in
multiple parts`, `uploading a small object with multipart_threshold configured`.

## Acceptance criteria

- [ ] The `s3_service_test.rb` row leaves `unported-files/activestorage.ts`
- [ ] All twelve pass under the Rails names, on the emulator chosen by
      `activestorage-cloud-ci-emulators`; `uploading with server-side encryption`
      runs on its fallback emulator if SeaweedFS cannot, or is a `PERMANENT-SKIP`
      naming the emulators if neither works
- [ ] `signed URL generation` uses the offline config for the `amazonaws.com` match
- [ ] Rails' `use_ssl: true` follows the emulator's scheme
- [ ] `upload a zero byte file` uses `setAvatar` / awaited assignment per 0209
