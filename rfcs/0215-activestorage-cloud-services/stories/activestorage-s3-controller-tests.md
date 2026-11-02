---
title: "Port the S3 arms of the controller tests"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-s3
packages: [activestorage]
deps:
  [
    activestorage-s3-service-test,
    activestorage-disk-and-direct-uploads-controllers,
    activestorage-blobs-controllers-and-streaming,
    activestorage-representations-controllers,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/controllers/direct_uploads_controller_test.rb:6-47`,
`vendor/rails/v8.0.2/activestorage/test/controllers/blobs/redirect_controller_test.rb:72`,
`vendor/rails/v8.0.2/activestorage/test/controllers/representations/redirect_controller_test.rb:137`. These stories
are open in 0209, which parks the S3 cases
(`activestorage-disk-and-direct-uploads-controllers`, line 35).

## Acceptance criteria

- [ ] Each parked S3 case is ported under its Rails name, replacing the
      `PERMANENT-SKIP`
- [ ] The direct-upload JSON matches Rails' headers and URL assertions
